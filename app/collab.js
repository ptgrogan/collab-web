
module.exports = function(io) {
  const fs = require('fs');
  const math = require('mathjs');
  const util = require('util');
  const AsyncLock = require('async-lock');
  const lock = new AsyncLock();
  const log_file = fs.createWriteStream(__dirname + '/log/log' + new Date().getTime() + '.log', {flags : 'w'});

  function log(message, json) {
    log_file.write(util.format('%i;%s;%j\n', new Date().getTime(), message, json));
  }

  let designers = []; // list of current designers
  let time_start = []; // list of starting times
  let time_complete = []; // list of time task complete
  let scores_training = [[]]; // list of training scores
  let scores = [[]]; // list of scores
  let admin = null; // current administrator

  let session = null; // shared state variable: be careful of concurrent modification
  let round = null; // shared state variable: be careful of concurrent modification

  function loadSession(number) {
    lock.acquire('key', function(done) {
      // build the experiment file name from session identifier
      const fileName = 'experiment' + String(number).padStart(3,'0') + '.json';
      // read the experiment from file
      session = JSON.parse(fs.readFileSync('../python/' + fileName));
      // resize designers to conform to session requirements
      if(designers.length != session.num_designers) {
        while(designers.length < session.num_designers) {
          // add a placeholder for a new designer
          designers.push(null);
        }
        while(designers.length > session.num_designers) {
          // remove and disconnect the last designer
          designers.pop().disconnect();
        }
      }
      // reset scores
      scores_training = new Array(session.num_designers);
      scores = new Array(session.num_designers);
      for(let i = 0; i < session.num_designers; i++) {
        scores_training[i] = new Array(session.training.length).fill(null);
        scores[i] = new Array(session.rounds.length).fill(null)
      }
      log('load', session.name);
      done();
    }, function() {
      setRound(session.training[0]);
    });
  };

  function setRound(new_round) {
    lock.acquire('key', function(done) {
      round = new_round;
      for(let i = 0; i < round.tasks.length; i++) {
        if(typeof round.tasks[i].solution === 'undefined') {
           round.tasks[i].solution = math.multiply(math.transpose(round.tasks[i].coupling), round.tasks[i].target);
        }
      }
      time_start = new Array(round.tasks.length).fill(null);
      time_complete = new Array(round.tasks.length).fill(null);
      log('round', round.name);
      done();
    }, function() {});
  }

  function setRoundName(name) {
    const trainingNames = session.training.map(task => task.name);
    const roundsNames = session.rounds.map(task => task.name);
    if(!trainingNames.includes(name) && !roundsNames.includes(name)) {
      return;
    }
    setRound(trainingNames.includes(name) ?
        session.training[trainingNames.indexOf(name)] :
        session.rounds[roundsNames.indexOf(name)]);
  };

  function nextRound() {
    if(session.training.includes(round) && session.training.indexOf(round) + 1 < session.training.length) {
      setRound(session.training[session.training.indexOf(round) + 1]);
    } else if(session.training.includes(round) && session.training.indexOf(round) + 1 >= session.training.length) {
      setRound(session.rounds[0]);
    } else if(session.rounds.includes(round) && session.rounds.indexOf(round) + 1 < session.rounds.length) {
      setRound(session.rounds[session.rounds.indexOf(round) + 1]);
    }
  };

  function getDesignerTask(designerIdx) {
    const taskIdx = round.assignments.map(designers => designers.includes(designerIdx)).indexOf(true);
    if(taskIdx >= 0) {
      return round.tasks[taskIdx];
    }
  }

  function updateScores() {
    for(let i = 0; i < round.tasks.length; i++) {
      for(let j = 0; j < round.tasks[i].designers.length; j++) {
        const time_stamp = new Date().getTime();
        const score = (round.is_complete ? Math.max(time_complete) : time_stamp)
            - (time_start[round.tasks[i].designers[j]] ? time_start[round.tasks[i].designers[j]] : time_stamp);
        if(session.training.includes(round)) {
          scores_training[round.tasks[i].designers[j]][session.training.indexOf(round)] = score;
        } else if(session.rounds.includes(round)) {
          scores[round.tasks[i].designers[j]][session.rounds.indexOf(round)] = score;
        }
      }
    }
  }

  function updateDesignerX(designerIdx, x) {
    lock.acquire('key', function(done) {
      log('action', {'designer': designerIdx, 'x': x});
      const task = getDesignerTask(designerIdx);
      const time_stamp = new Date().getTime();
      if(!task) {
        return;
      }
      if(typeof task.x === 'undefined') {
        task.x = new Array(task.inputs.length).fill(0);
      }
      let j = 0;
      for(let i = 0; i < task.inputs.length; i++) {
        if(task.inputs[i] === designerIdx && i < task.x.length && j < x.length) {
          task.x[i] = x[j];
          j++;
        }
      }
      task.y = math.multiply(task.coupling, task.x);
      for(let i = 0; i < task.designers.length; i++) {
        if(!time_start[task.designers[i]]) {
          time_start[task.designers[i]] = time_stamp;
        }
      }

      if([...Array(task.y.length).keys()].every(i => Math.abs(task.y[i] - task.target[i]) <= session.error_tol)) {
        task.is_complete = true;
        for(let i = 0; i < task.designers.length; i++) {
          time_complete[task.designers[i]] = time_stamp;
        }
        log('complete', task);
      } else {
        task.is_complete = false;
      }

      if(round.tasks.every(i => i.is_complete)) {
        round.is_complete = true;
        updateScores(round);
        log('complete', round.name);
      } else {
        round.is_complete = false;
      }
      done();
    }, function() {});
  }

  function getDesignerY(designerIdx) {
    const task = getDesignerTask(designerIdx);
    if(!task) {
      return;
    }
    if(typeof task.y === 'undefined') {
      task.y = new Array(task.outputs.length).fill(0);
    }
    const y = new Array(task.num_outputs[task.designers.indexOf(designerIdx)]).fill(0);
    let j = 0;
    for(let i = 0; i < task.outputs.length; i++) {
      if(task.outputs[i] === designerIdx && i < task.y.length && j < y.length) {
        y[j] = task.y[i]
        j++;
      }
    }
    return y;
  }

  function getDesignerTarget(designerIdx) {
    const task = getDesignerTask(designerIdx);
    if(!task) {
      return;
    }
    const target = new Array(task.num_outputs[task.designers.indexOf(designerIdx)]).fill(0);
    let j = 0;
    for(let i = 0; i < task.outputs.length; i++) {
      if(task.outputs[i] === designerIdx && i < task.target.length && j < target.length) {
        target[j] = task.target[i]
        j++;
      }
    }
    return target;
  }

  io.on('connection', client => {
    let designerIdx = -1;

    client.on('register-admin', () => {
      if(admin === null) {
        admin = client;
      }
      client.emit('session-loaded', {
        'training': session.training.map(round => round.name),
        'rounds': session.rounds.map(round => round.name)
      });
      client.emit('round-updated', round);
    });

    client.on('register-designer', () => {
      for(let i = 0; i < designers.length; i++) {
        if(designers[i] === null) {
          designers[i] = client;
          designerIdx = i;
          break;
        }
      }
      client.emit('idx-updated', designerIdx);
      const task = getDesignerTask(designerIdx);
      client.emit('round-updated', {
        'name': round.name,
        'num_inputs': task.num_inputs[task.designers.indexOf(designerIdx)],
        'num_outputs': task.num_outputs[task.designers.indexOf(designerIdx)],
        'target': getDesignerTarget(designerIdx)
      });
    });

    function scoreRound() {
      updateScores();
      if(session.training.includes(round)) {
        if(admin) {
          admin.emit('score-updated', {'scores': scores_training, 'totals': scores_training.map(score => score.reduce((total, sum) => total + sum))});
        }
        for(let i = 0; i < designers.length; i++) {
          if(designers[i]) {
            designers[i].emit('score-updated', {'scores': scores_training[i], 'score': scores_training[i][session.training.indexOf(round)], 'total': scores_training[i].reduce((total, sum) => total + sum)});
          }
        }
      } else if(session.rounds.includes(round)) {
        if(admin) {
          admin.emit('score-updated', {'scores': scores, 'totals': scores.map(score => score.reduce((total, sum) => total + sum))});
        }
        for(let i = 0; i < designers.length; i++) {
          if(designers[i]) {
            designers[i].emit('score-updated', {'scores': scores[i], 'score': scores[i][session.rounds.indexOf(round)], 'total': scores[i].reduce((total, sum) => total + sum)});
          }
        }
      }
    }

    function updateTask(task) {
      // update outputs for all designers in same task
      for(let i = 0; i < task.designers.length; i++) {
        const idx = task.designers[i];
        if(designers[idx]) {
          designers[idx].emit('y-updated', getDesignerY(idx));
          if(task.is_complete) {
            designers[idx].emit('task-completed');
          }
        }
      }
      // update inputs/outputs for admin
      if(admin) {
        admin.emit('task-updated', task);
      }
      if(round.is_complete) {
        if(admin) {
          admin.emit('round-completed');
        }
        scoreRound();
      }
    }

    client.on('update-x', x => {
      if(designerIdx >= 0) {
        updateDesignerX(designerIdx, x);
        updateTask(getDesignerTask(designerIdx));
      }
    });

    function updateRound() {
      // update interface for admin
      if(admin) {
        admin.emit('round-updated', round);
      }
      // update interface for each designer
      for(let i = 0; i < designers.length; i++) {
        if(designers[i]) {
          const task = getDesignerTask(i);
          designers[i].emit('round-updated', {
            'name': round.name,
            'num_inputs': task.num_inputs[task.designers.indexOf(i)],
            'num_outputs': task.num_outputs[task.designers.indexOf(i)],
            'target': getDesignerTarget(i)
          });
        }
      }
    }

    client.on('set-round', roundName => {
      setRoundName(roundName);
      updateRound();
    });

    client.on('next-round', () => {
      nextRound();
      updateRound();
    });

    client.on('score-round', () => {
      scoreRound();
    });

    client.on('disconnect', () => {
      if(admin === client) {
        admin = null;
      }
      for(let i = 0; i < designers.length; i++) {
        if(designers[i] === client) {
          designers[i] = null;
        }
      }
    });
  });

  loadSession(2);
};
