/**
 * Designer interface script.
 *
 * Defines behaviors for the designer interface.
 *
 * @author Paul T. Grogan <pgrogan@stevens.edu>.
 * @since  0.0.0
 */

$(function() {
  var task;

  var socket = io.connect();
  socket.on('connect', function(data) {
      socket.emit('join-designer', "test");
  });
  socket.on('id', function(data) {
    $("#designer-id").text(data+1);
  });
  socket.on('task', function(data) {
    update_task(data);
  });
  socket.on('design-y', function(data) {
    update(data);
  });

  var inputs = [];
  var outputs = [];
  var status = [];

  var update_task = function(data) {
    task = data;
    $("#task").text(task.name);
    for(i = 0; i < outputs.length; i++) {
      if(outputs[i]) {
        outputs[i].noUiSlider.destroy();
      }
    }
    outputs = new Array(task.outputs.length);
    status = new Array(task.outputs.length);
    $(".container-outputs").empty();
    for(i = 0; i < task.outputs.length; i++) {
      y_i = task.outputs[i];
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
    $(".row-inputs").empty();
    for(i = 0; i < task.inputs.length; i++) {
      x_i = task.inputs[i];
      $(".row-inputs").append('<div class="col-2"><div class="text-center pb-3"><label for="x"'+(x_i+1)+'>X<sub>'+(x_i+1)+'</sub></label></div><div id="x'+(x_i+1)+'" class="mx-auto" style="height:300px;"></div></div>');
      inputs[i] = $('#x'+(x_i+1))[0];
      noUiSlider.create(inputs[i], {
          start: 0,
          orientation: 'vertical',
          range: { 'min': -1, 'max': 1 }
      });
      inputs[i].noUiSlider.on('set', function() {
        var x = [...task.inputs.keys()].map(j => inputs[j].noUiSlider.get());
        socket.emit('design-x', x);
      });
    }

    update(new Array(task.target.length).fill(0));
  };
  var update = function(y) {
    var y_data = new Array(task.outputs.length);
    var is_new = false;
    for(i = 0; i < task.outputs.length; i++) {
      y_data[i] = y[task.outputs[i]];
      if(y_data[i] != outputs[i].noUiSlider.get()) {
        is_new = true;
      }
    }
    if(!is_new) {
      return;
    }
    for(i = 0; i < task.outputs.length; i++) {
      outputs[i].noUiSlider.set(y[task.outputs[i]]);
      if(math.abs(y[task.outputs[i]]-task.target[task.outputs[i]]) <= 0.05) {
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
  };
});
