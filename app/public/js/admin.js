/**
 * Administrator interface script.
 *
 * Defines behaviors for the administrator interface.
 *
 * @author Paul T. Grogan <pgrogan@stevens.edu>.
 * @since  0.0.0
 */

 $(function() {
  var num_designers;
  var session;
  var round;
  var timer;

  var socket = io.connect();
  socket.on('connect', function() {
      socket.emit('register-admin');
  });

  $('#sessionSelect').change(function() {
    $('#modalConfirm').modal('show');
  });
  $('#modalConfirmOK').click(function() {
    session = $('#sessionSelect').val();
    socket.emit('load-session', $('#sessionSelect').val());
    $('#modalConfirm').modal('hide');
  });
  $('#modalConfirm').on('hidden.bs.modal', function() {
    $('#sessionSelect').val(session);
  });

  socket.on('round-updated', function(new_round) {
    round = new_round;
    $('#roundSelect').val(round.name);
    update_round(new_round);
  });
  socket.on('task-updated', function(new_task) {
    update_task(new_task);
  });
  socket.on('session-loaded', function(data) {
    session = data.name.match(/\d+/g)[0];
    num_designers = data.num_designers;
    $('#roundSelect').empty();
    $.each(data.training, function(key, value) {
      $('#roundSelect').append($('<option></option>').attr('value', value).text(value));
    });
    $.each(data.rounds, function(key, value) {
      $('#roundSelect').append($('<option></option>').attr('value', value).text(value));
    });
    $('#timeContainer').empty();
    for(var i = 0; i < data.num_designers; i++) {
      $('#timeContainer').append('<div class="col-' + Math.floor(12/data.num_designers) + ' alert alert-secondary d-none" id="timeContainer-' + i + '"><div class="badge badge-secondary"><span class="oi oi-clock" aria-hidden="true"></span></div> <span id="time-' + i + '"></span></div>');
    }
    $('#scorePopover').empty();
    for(var i = 0; i < data.num_designers; i++) {
      $('#scorePopover').append('<div class="col-' + Math.floor(12/data.num_designers) + ' alert alert-secondary"><div class="badge badge-secondary"><span class="oi oi-person" aria-hidden="true"></span> ' + (i+1) + '</div> <span id="score-' + i + '"></span></div>');
    }
  });
  socket.on('round-completed', function(data) {
    $('#nextRound').removeClass('btn-outline-secondary');
    $('#nextRound').addClass('btn-primary');
  });

  $('#roundSelect').change(function() {
    $('#nextRound').removeClass('btn-primary');
    $('#nextRound').addClass('btn-outline-secondary');
    socket.emit('set-round', $('#roundSelect').val());
  });
  $('#nextRound').click(function() {
    $('#nextRound').removeClass('btn-primary');
    $('#nextRound').addClass('btn-outline-secondary');
    socket.emit('next-round');
  });
  $('#scoreRound').click(function() {
    socket.emit('score-round');
  });
  socket.on('score-updated', function(data) {
    var totals = new Array(data.scores.length).fill(0);
    for(var i = 0; i < data.scores.length; i++) {
      $('#score-'+i).text(Math.round(data.totals[i]/1000));
    }
    $('#scorePopover').attr('data-content', buildPopperTable(data.scores, data.totals));
  });
  socket.on('time-updated', update_time);

  function buildPopperTable(scores, totals) {
    var html = '<table class="table table-sm table-striped"><thead class="thead-dark"><tr><th>Round</th>'
    for(var i = 0; i < scores.length; i++) {
      html += '<th>D' + (i+1) + '</th>';
    }
    html += '<tr></thead><tbody>';
    if(scores.length > 0) {
      for(var i = 0; i < scores[0].length; i++) {
        html += '<tr><td>' + (i+1) + '</td>';
        for(var j = 0; j < scores.length; j++) {
          html += '<td>' + (scores[j][i] || scores[j][i] === 0 ? Math.round(scores[j][i]/1000) : '-') + '</td>';
        }
        html += '</tr>';
      }
    }
    html += '<tr><td>Total</td>'
    for(var i = 0; i < totals.length; i++) {
      html += '<td>' + Math.round(totals[i]/1000) + '</td>';
    }
    html += '</tr></tbody></table>';
    return html;
  }

  $('#scorePopover').popover({
    trigger: 'hover',
    html: true,
    container: 'body',
    content: buildPopperTable([], []),
    placement: 'bottom'
  });

  var inputs = [[]];
  var outputs = [[]];
  var status = [[]];
  var errorChart;

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
        $(".container-outputs").append('<div class="row my-3"><div class="col-1 text-center"><label for="y'+(idx+1)+'">Y<sub>'+(idx+1)+'</sub></label></div><div class="col-9"><div id="y'+(idx+1)+'" disabled style="width:100%"></div></div><div class="col-2"><span id="y'+(idx+1)+'s" class="alert alert-danger oi oi-x" aria-hidden="true"></div></div>');
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
        $(".row-inputs").append('<div class="col-1"><div class="text-center pb-3"><label for="x"'+(idx+1)+'>X<sub>'+(idx+1)+'</sub></label></div><div id="x'+(idx+1)+'" class="mx-auto" disabled style="height:300px;"></div></div>');
        inputs[i][j] = $('#x'+(idx+1))[0];
        noUiSlider.create(inputs[i][j], {
            start: 0,
            orientation: 'vertical',
            direction: 'rtl',
            range: { 'min': -1, 'max': 1 }
        });
        idx++;
      }
    }
    if(errorChart) {
      errorChart.destroy();
    }

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
          borderColor: colors[round.tasks.indexOf(task) % colors.length],
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
    update_time(new Array(num_designers).fill(undefined));
    for(var i = 0; i < round.tasks.length; i++) {
      update_task(round.tasks[i]);
    }
  };

  function format_time(t) {
    var minutes = Math.floor(t/1000/60).toString();
    var seconds = Math.floor(t/1000%60).toString();
    var milliseconds = ((t%1000*60)*10).toString().substring(0,1);
    return (minutes.length == 1 ? '0'+minutes : minutes) + ':' + (seconds.length == 1 ? '0'+seconds : seconds) + '.' + milliseconds;
  }
  function update_time(t) {
    for(var i = 0; i < t.length; i++) {
      if(t[i] == null && round.max_time == null) {
        $('#timeContainer-'+i).addClass('d-none');
      } else {
        $('#timeContainer-'+i).removeClass('d-none');
        if(t[i] < round.max_time/10) {
          $('#timeContainer-'+i).removeClass('alert-secondary');
          $('#timeContainer-'+i).removeClass('alert-warning');
          $('#timeContainer-'+i).addClass('alert-danger');
        } else if(t[i] < round.max_time/4) {
          $('#timeContainer-'+i).removeClass('alert-secondary');
          $('#timeContainer-'+i).removeClass('alert-danger');
          $('#timeContainer-'+i).addClass('alert-warning');
        } else {
          $('#timeContainer-'+i).removeClass('alert-warning');
          $('#timeContainer-'+i).removeClass('alert-danger');
          $('#timeContainer-'+i).addClass('alert-secondary');
        }
        if(t[i] == null) {
          $('#time-'+i).text(format_time(round.max_time));
        } else {
          $('#time-'+i).text(format_time(t[i]));
        }
      }
    }
  }
  function update_task(task) {
    if(!task.x) {
      task.x = new Array(task.inputs.length).fill(0)
    }
    if(!task.y) {
      task.y = new Array(task.outputs.length).fill(0)
    }
    var idx = round.tasks.map(function(task) { return task.designers.join(); }).indexOf(task.designers.join());
    for(var i = 0; i < task.inputs.length; i++) {
      inputs[idx][i].noUiSlider.set(task.x[i]);
    }
    for(var i = 0; i < task.outputs.length; i++) {
      outputs[idx][i].noUiSlider.set(task.y[i]);
      status[idx][i].removeClass('alert-success');
      status[idx][i].removeClass('alert-secondary');
      status[idx][i].removeClass('alert-danger');
      status[idx][i].removeClass('oi-check');
      status[idx][i].removeClass('oi-chevron-left');
      status[idx][i].removeClass('oi-chevron-right');
      status[idx][i].removeClass('oi-x');
      if(math.abs(task.y[i] - task.target[i]) <= 0.05) {
        status[idx][i].addClass('alert-success');
        status[idx][i].addClass('oi-check');
      } else if(task.y[i] < -1.25) {
        status[idx][i].addClass('alert-secondary');
        status[idx][i].addClass('oi-chevron-left');
      } else if(task.y[i] > 1.25) {
        status[idx][i].addClass('alert-secondary');
        status[idx][i].addClass('oi-chevron-right');
      } else {
        status[idx][i].addClass('alert-danger');
        status[idx][i].addClass('oi-x');
      }
    }
    var error = math.norm(math.subtract(task.target, task.y));
    errorChart.data.datasets[idx].data.push({x: Date.now(), y: error});
    errorChart.update();
  };
});
