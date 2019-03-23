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
    $('#roundSelect').val(round.name);
    update_round(new_round);
  });
  socket.on('task-updated', function(new_task) {
    update_task(new_task);
  });
  socket.on('session-loaded', function(data) {
    $('#roundSelect').empty();
    $.each(data.training, function(key, value) {
      $('#roundSelect').append($('<option></option>').attr('value', value).text(value));
    });
    $.each(data.rounds, function(key, value) {
      $('#roundSelect').append($('<option></option>').attr('value', value).text(value));
    });
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
    $('#scorePopover').empty();
    var totals = new Array(data.scores.length).fill(0);
    for(var i = 0; i < data.scores.length; i++) {
      $('#scorePopover').append('<div class="col-' + Math.floor(12/data.scores.length) + '"><div class="badge badge-secondary"><span class="oi oi-person" aria-hidden="true"></span> ' + (i+1) + '</div> ' + Math.round(data.totals[i]/1000) + '</div>');
    }
    $('#scorePopover').attr('data-content', buildPopperTable(data.scores, data.totals));
  });

  function buildPopperTable(scores, totals) {
    var html = '<table class="table table-striped"><thead class="thead-dark"><tr><th>Round</th>'
    for(var i = 0; i < scores.length; i++) {
      html += '<th>D&nbsp;' + (i+1) + '</th>';
    }
    html += '<tr></thead><tbody>';
    if(scores.length > 0) {
      for(var i = 0; i < scores[0].length; i++) {
        html += '<tr><td>' + (i+1) + '</td>';
        for(var j = 0; j < scores.length; j++) {
          html += '<td>' + (scores[j][i] ? Math.round(scores[j][i]/1000) : '-') + '</td>';
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
    $(".row-error").append('<div class="col-12"><canvas id="errorChart" height="200px"></canvas></div>');

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
      update_task(round.tasks[i]);
    }
  };

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
