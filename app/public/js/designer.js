/**
 * Designer interface script.
 *
 * Defines behaviors for the designer interface.
 *
 * @author Paul T. Grogan <pgrogan@stevens.edu>.
 * @since  0.0.0
 */

$(function() {
  var round;
  var audio = [new Audio('resources/success-1.mp3'), new Audio('resources/success-2.mp3')];

  var socket = io.connect();
  socket.on('connect', function() {
      socket.emit('register-designer');
  });
  socket.on('idx-updated', function(idx) {
    $("#designer-id").text(idx+1);
  });
  socket.on('round-updated', function(new_round) {
    round = new_round;
    update_round(new_round);
  });
  socket.on('y-updated', function(y) {
    update_task(y);
  });
  socket.on('task-completed', function(data) {
    for(i = 0; i < inputs.length; i++) {
      inputs[i].setAttribute('disabled', true);
    }
    audio[Math.random() < 0.5 ? 0 : 1].play();
  });
  socket.on('score-updated', function(data) {
    $('#score').text(Math.round(data.total/1000) + ' (+' + Math.round(data.score/1000) + ')');
    $('#scorePopover').attr('data-content', buildPopperTable(data.scores, data.total));
  });

  function buildPopperTable(scores, total) {
    var html = '<table class="table table-striped"><thead class="thead-dark"><tr><th>Round</th><th>Points</th><tr></thead><tbody>';
    for(var i = 0; i < scores.length; i++) {
      html += '<tr><td>' + (i+1) + '</td><td>' + (scores[i] ? Math.round(scores[i]/1000) : 'n/a') + '</td></tr>';
    }
    html += '<tr><td>Total</td><td>' + Math.round(total/1000) + '</td></tr>';
    html += '</tbody></table>';
    return html;
  }

  $('#scorePopover').popover({
    trigger: 'hover',
    html: true,
    content: buildPopperTable([], 0),
    placement: 'bottom'
  });

  var inputs = [];
  var outputs = [];
  var status = [];

  function update_round(round) {
    $("#task").text(round.name);
    for(var i = 0; i < outputs.length; i++) {
      if(outputs[i]) {
        outputs[i].noUiSlider.destroy();
      }
    }
    outputs = new Array(round.num_outputs);
    status = new Array(round.num_outputs);
    $(".container-outputs").empty();
    for(var i = 0; i < round.num_outputs; i++) {
      $(".container-outputs").append('<div class="row my-3"><div class="col-1 text-center"><label for="y'+(i+1)+'">Y<sub>'+(i+1)+'</sub></label></div><div class="col-10"><div id="y'+(i+1)+'" disabled style="width:100%"></div></div><div class="col-1"><span id="y'+(i+1)+'s" class="alert alert-danger oi oi-x" aria-hidden="true"></div></div>');
      outputs[i] = $('#y'+(i+1))[0];
      status[i] = $('#y'+(i+1)+'s');
      noUiSlider.create(outputs[i], {
          start: 0,
          behavior: 'none',
          range: { 'min': -1.25, 'max': 1.25 },
          pips: {
              mode: 'values',
              values: [round.target[i]-0.05, round.target[i]+0.05],
              density: -1,
              format: { to: function(value) { return ""; } }
          }
      });
    }
    for(var i = 0; i < inputs.length; i++) {
      if(inputs[i]) {
        inputs[i].noUiSlider.destroy();
      }
    }
    inputs = new Array(round.num_inputs);
    $(".row-inputs").empty();
    for(i = 0; i < round.num_inputs; i++) {
      $(".row-inputs").append('<div class="col-1"><div class="text-center pb-3"><label for="x"'+(i+1)+'>X<sub>'+(i+1)+'</sub></label></div><div id="x'+(i+1)+'" class="mx-auto" style="height:300px;"></div></div>');
      inputs[i] = $('#x'+(i+1))[0];
      noUiSlider.create(inputs[i], {
          start: 0,
          orientation: 'vertical',
          range: { 'min': -1, 'max': 1 }
      });
      inputs[i].noUiSlider.on('set', function() {
        var x = [...new Array(round.num_inputs).keys()].map(function(j) { return inputs[j].noUiSlider.get()});
        socket.emit('update-x', x);
      });
    }

    update_task(new Array(round.num_outputs).fill(0));
  };

  function update_task(y) {
    for(i = 0; i < y.length; i++) {
      outputs[i].noUiSlider.set(y[i]);
      status[i].removeClass('alert-success');
      status[i].removeClass('alert-secondary');
      status[i].removeClass('alert-danger');
      status[i].removeClass('oi-check');
      status[i].removeClass('oi-chevron-left');
      status[i].removeClass('oi-chevron-right');
      status[i].removeClass('oi-x');
      if(math.abs(y[i]-round.target[i]) <= 0.05) {
        status[i].addClass('alert-success');
        status[i].addClass('oi-check');
      } else if(y[i] < -1.25) {
        status[i].addClass('alert-secondary');
        status[i].addClass('oi-chevron-left');
      } else if(y[i] > 1.25) {
        status[i].addClass('alert-secondary');
        status[i].addClass('oi-chevron-right');
      } else {
        status[i].addClass('alert-danger');
        status[i].addClass('oi-x');
      }
    }
  };
});
