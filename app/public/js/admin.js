/**
 * Administrator interface script.
 *
 * Defines behaviors for the administrator interface.
 *
 * @author Paul T. Grogan <pgrogan@stevens.edu>.
 * @since  0.0.0
 */

 $(function() {
  var round;
  var errorChart;

  var socket = io.connect();
  socket.on('connect', function() {
      socket.emit('register-admin');
  });
  socket.on('round-updated', function(new_round) {
    round = new_round;
    update_round(new_round);
  });
  socket.on('task-updated', function(new_task) {
    update_task(round, new_task);
  });

  $('#taskSelect').change(function() {
    socket.emit('next-round');
    // socket.emit('task', $('#taskSelect')[0].selectedIndex);
  });

  var inputs = [[]];
  var outputs = [[]];
  var status = [[]];

  function update_round(round) {
    for(var i = 0; i < outputs.length; i++) {
      for(var j = 0; j < outputs[i].length; j++) {
        if(outputs[i][j]) {
          outputs[i][j].noUiSlider.destroy();
        }
      }
    }
    outputs = new Array(round.tasks.length);
    status = new Array(round.tasks.length);
    $(".container-outputs").empty();
    var idx = 0;
    for(var i = 0; i < round.tasks.length; i++) {
      outputs[i] = new Array(round.tasks[i].outputs.length);
      status[i] = new Array(round.tasks[i].outputs.length);
      for(var j = 0; j < round.tasks[i].outputs.length; j++) {
        $(".container-outputs").append('<div class="row my-3"><div class="col-1 text-center"><label for="y'+(idx+1)+'">Y<sub>'+(idx+1)+'</sub></label></div><div class="col-10"><div id="y'+(idx+1)+'" disabled style="width:100%"></div></div><div class="col-1"><span id="y'+(idx+1)+'s" class="alert alert-danger oi oi-x" aria-hidden="true"></div></div>');
        outputs[i][j] = $('#y'+(idx+1))[0];
        status[i][j] = $('#y'+(idx+1)+'s');
        noUiSlider.create(outputs[i][j], {
            start: 0,
            behavior: 'none',
            range: { 'min': -1.25, 'max': 1.25 },
            pips: {
                mode: 'values',
                values: [round.tasks[i].target[j]-0.05, round.tasks[i].target[j]+0.05],
                density: -1,
                format: { to: function(value) { return ""; } }
            }
        });
        idx++;
      }
    }
    for(var i = 0; i < inputs.length; i++) {
      for(var j = 0; j < inputs[i].length; j++) {
        if(inputs[i][j]) {
          inputs[i][j].noUiSlider.destroy();
        }
      }
    }
    inputs = new Array(round.tasks.length);
    $(".row-inputs").empty();
    idx = 0;
    for(i = 0; i < round.tasks.length; i++) {
      inputs[i] = new Array(round.tasks[i].inputs.length);
      for(var j = 0; j < round.tasks[i].inputs.length; j++) {
        $(".row-inputs").append('<div class="col-2"><div class="card"><div class="card-header text-center"><label for="x"'+(idx+1)+'>X<sub>'+(idx+1)+'</sub></label></div><div class="card-body"><div id="x'+(idx+1)+'" class="mx-auto" disabled style="height:300px;"></div></div></div></div>');
        inputs[i][j] = $('#x'+(idx+1))[0];
        noUiSlider.create(inputs[i][j], {
            start: 0,
            orientation: 'vertical',
            range: { 'min': -1, 'max': 1 }
        });
        idx++;
      }
    }
    if(errorChart) {
      errorChart.destroy();
    }
    $(".row-inputs").append('<div class="col-12"><div class="card"><div class="card-header text-center">Error</div><div class="card-body"><canvas id="errorChart" height="200px"></canvas></div></div></div>');

    var colors = [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ];

    errorChart = new Chart($("#errorChart")[0], {
      type: 'line',
      data: {
        datasets: round.tasks.map(function(task) {return {
          label: 'Designer' + (task.designers.length>1?'s ':' ') + task.designers.map(function(designer) { return designer+1; }).join(', '),
          lineTension: 0,
          fill: false,
          backgroundColor: colors[round.tasks.indexOf(task) % colors.length]
        }})
      },
      options: {
        legend: { display: true },
        scales: {
          xAxes: [{
            type: 'time'
          }],
          yAxes: [{
            ticks: { display: false }
          }]
        }
      }
    });
    for(var i = 0; i < round.tasks.length; i++) {
      update_task(round, round.tasks[i]);
    }
  };

  function update_task(round, task) {
    if(!task.x) {
      task.x = new Array(task.inputs.length).fill(0)
    }
    if(!task.y) {
      task.y = new Array(task.outputs.length).fill(0)
    }
    var idx = round.tasks.indexOf(task);
    for(var i = 0; i < task.inputs.length; i++) {
      inputs[idx][i].noUiSlider.set(task.x[i]);
    }
    for(var i = 0; i < task.outputs.length; i++) {
      outputs[idx][i].noUiSlider.set(task.y[i]);
      if(math.abs(task.y[i] - task.target[i]) <= 0.05) {
          status[idx][i].removeClass('alert-danger');
          status[idx][i].removeClass('oi-x');
          status[idx][i].addClass('alert-success');
          status[idx][i].addClass('oi-check');
      } else {
          status[idx][i].removeClass('alert-success');
          status[idx][i].removeClass('oi-check');
          status[idx][i].addClass('alert-danger');
          status[idx][i].addClass('oi-x');
      }
    }
    var error = math.norm(math.subtract(task.target, task.y));
    errorChart.data.datasets[idx].data.push({x: Date.now(), y: error});
    errorChart.update();
  };
});
