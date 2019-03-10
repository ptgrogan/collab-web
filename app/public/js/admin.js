$(function() {
  var task, errorChart;

  var socket = io.connect();
  socket.on('connect', function(data) {
      socket.emit('join-admin', "test");
      socket.emit('task', $('#taskSelect')[0].selectedIndex);
  });
  socket.on('task', function(data) {
    update_task(data);
  });
  socket.on('design-y', function(data) {
    update(data);
  });
  socket.on('broadcast', function(data) {
    $('#broadcastCheck').prop('checked', data);
  });

  $('#taskSelect').change(function() {
    socket.emit('task', $('#taskSelect')[0].selectedIndex);
  });
  $('#broadcastCheck').change(function() {
    socket.emit('broadcast', $(this).prop('checked'));
  });

  var inputs = [];
  var outputs = [];
  var status = [];

  var update_task = function(data) {
    task = data;
    for(i = 0; i < outputs.length; i++) {
      if(outputs[i]) {
        outputs[i].noUiSlider.destroy();
      }
    }
    outputs = new Array(task.outputs.flat().length);
    status = new Array(task.outputs.flat().length);
    $(".container-outputs").empty();
    for(i = 0; i < task.outputs.flat().length; i++) {
      y_i = i;
      $(".container-outputs").append('<div class="row my-3"><div class="col-1 text-center"><label for="y'+(y_i+1)+'">Y<sub>'+(y_i+1)+'</sub></label></div><div class="col-10"><div id="y'+(y_i+1)+'" disabled style="width:100%"></div></div><div class="col-1"><span id="y'+(y_i+1)+'s" class="alert alert-danger oi oi-x" aria-hidden="true"></div></div>');
      outputs[i] = $('#y'+(y_i+1))[0];
      status[i] = $('#y'+(y_i+1)+'s');
      noUiSlider.create(outputs[i], {
          start: 0,
          behavior: 'none',
          range: { 'min': -1.25, 'max': 1.25 },
          pips: {
              mode: 'values',
              values: [task.target[y_i]-0.05, task.target[y_i]+0.05],
              density: -1,
              format: { to: function(value) { return ""; } }
          }
      });
    }
    for(i = 0; i < inputs.length; i++) {
      if(inputs[i]) {
        inputs[i].noUiSlider.destroy();
      }
    }
    inputs = new Array(task.inputs.length);
    if(errorChart) {
      errorChart.destroy();
    }
    $(".row-inputs").empty();
    for(i = 0; i < task.inputs.flat().length; i++) {
      x_i = i;
      $(".row-inputs").append('<div class="col-2"><div class="card"><div class="card-header text-center"><label for="x"'+(x_i+1)+'>X<sub>'+(x_i+1)+'</sub></label></div><div class="card-body"><div id="x'+(x_i+1)+'" class="mx-auto" disabled style="height:300px;"></div></div></div></div>');
      inputs[i] = $('#x'+(x_i+1))[0];
      noUiSlider.create(inputs[i], {
          start: 0,
          orientation: 'vertical',
          range: { 'min': -1, 'max': 1 }
      });
    }
    $(".row-inputs").append('<div class="col-12"><div class="card"><div class="card-header text-center">Error</div><div class="card-body"><canvas id="errorChart" height="200px"></canvas></div></div></div>');

    errorChart = new Chart($("#errorChart")[0], {
      type: 'line',
      data: {
        datasets: [{
          label: 'Error',
          lineTension: 0,
          fill: false
        }]
      },
      options: {
        legend: { display: false },
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
    update(new Array(task.target.length).fill(0));
  };
  var update = function(y) {
    var is_new = false;
    for(i = 0; i < y.length; i++) {
      if(y[i] != outputs[i].noUiSlider.get()) {
        is_new = true;
      }
    }
    if(!is_new) {
      return;
    }
    for(i = 0; i < y.length; i++) {
      outputs[i].noUiSlider.set(y[i]);
      if(math.abs(y[i]-task.target[i]) <= 0.05) {
          status[i].removeClass('alert-danger');
          status[i].removeClass('oi-x');
          status[i].addClass('alert-success');
          status[i].addClass('oi-check');
      } else {
          status[i].removeClass('alert-success');
          status[i].removeClass('oi-check');
          status[i].addClass('alert-danger');
          status[i].addClass('oi-x');
      }
    }
    var error = math.norm(math.subtract(task.target, y));
    errorChart.data.datasets[0].data.push({x: Date.now(), y: error});
    errorChart.update();
  };
});
