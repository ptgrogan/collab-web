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
  var timer;
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
    clearInterval(timer);
    update_round(new_round);
  });
  socket.on('y-updated', update_task);
  socket.on('time-updated', function(t) {
    if(timer) {
      clearInterval(timer);
    }
    update_time(t);
    if(t > 0) {
      timer = setInterval(function() {
        t -= 200;
        if(t > 0) {
          update_time(t);
        } else {
          update_time(0);
          clearInterval(timer);
        }
      }, 200);
    }
  });
  socket.on('task-completed', function(data) {
    for(i = 0; i < inputs.length; i++) {
      inputs[i].setAttribute('disabled', true);
      for(var j = 0; j < input_buttons[i].length; j++) {
        input_buttons[i][j].prop('disabled', true);
      }
    }
    clearInterval(timer);
    audio[Math.random() < 0.5 ? 0 : 1].play();
  });
  socket.on('score-updated', function(data) {
    $('#score').text(Math.round(data.total/1000) + ' (+' + Math.round(data.score/1000) + ')');
    $('#scorePopover').attr('data-content', buildPopperTable(data.scores, data.total));
  });

  function buildPopperTable(scores, total) {
    var html = '<table class="table table-sm table-striped"><thead class="thead-dark"><tr><th>Round</th><th>Points</th><tr></thead><tbody>';
    for(var i = 0; i < scores.length; i++) {
      html += '<tr><td>' + (i+1) + '</td><td>' + (scores[i] || scores[i] === 0 ? Math.round(scores[i]/1000) : '-') + '</td></tr>';
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
  var input_buttons = [];
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
      $(".container-outputs").append('<div class="row my-3"><div class="col-1 text-center"><label for="y'+(i+1)+'">Y<sub>'+(i+1)+'</sub></label></div><div class="col-9"><div id="y'+(i+1)+'" disabled style="width:100%"></div></div><div class="col-2"><span id="y'+(i+1)+'s" class="alert alert-danger oi oi-x" aria-hidden="true"></div></div>');
      outputs[i] = $('#y'+(i+1))[0];
      status[i] = $('#y'+(i+1)+'s');
      noUiSlider.create(outputs[i], {
          start: 0,
          behavior: 'none',
          range: { 'min': -1.25, 'max': 1.25 },
          keyboardSupport: false,
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
    input_buttons = new Array(round.num_inputs);
    $(".row-inputs").empty();
    for(var i = 0; i < round.num_inputs; i++) {
      $(".row-inputs").append('<div class="col-3"><div class="text-center"><label for="x"'+(i+1)+'>X<sub>'+(i+1)+'</sub></label><br /><button id="x'+(i+1)+'-up" class="btn btn-sm btn-outline-secondary" tabindex="-1"><span class="oi oi-caret-top" aria-hidden="true"></span></button><button id="x'+(i+1)+'-upp" class="btn btn-sm btn-outline-secondary" tabindex="-1"><span class="oi oi-collapse-up" aria-hidden="true"></span></button><div id="x'+(i+1)+'" class="mx-auto my-3" style="height:300px;"></div><button id="x'+(i+1)+'-dn" class="btn btn-sm btn-outline-secondary" tabindex="-1"><span class="oi oi-caret-bottom" aria-hidden="true"></span></button><button id="x'+(i+1)+'-dnn" class="btn btn-sm btn-outline-secondary" tabindex="-1"><span class="oi oi-collapse-down" aria-hidden="true"></span></button></div></div>');
      inputs[i] = $('#x'+(i+1))[0];
      input_buttons[i] = [$('#x'+(i+1)+'-up'), $('#x'+(i+1)+'-upp'), $('#x'+(i+1)+'-dn'), $('#x'+(i+1)+'-dnn')];
      noUiSlider.create(inputs[i], {
          start: 0,
          orientation: 'vertical',
          direction: 'rtl',
          step: 0.01,
          range: { 'min': -1, 'max': 1 }
      });
      $('#x'+(i+1)).attr('tabindex', (i+1));
      inputs[i].noUiSlider.on('set', function() {
        var x = [...new Array(round.num_inputs).keys()].map(function(j) { return Number(inputs[j].noUiSlider.get())});
        socket.emit('update-x', x);
      });
      function pushSlider(slider, delta) {
        return function() {
          if(!slider.getAttribute('disabled')) {
            slider.noUiSlider.set(Number(slider.noUiSlider.get()) + delta);
          }
        }
      }
      $('#x'+(i+1)+'-up').click(pushSlider(inputs[i], 0.01));
      $('#x'+(i+1)+'-upp').click(pushSlider(inputs[i], 0.1));
      $('#x'+(i+1)+'-dn').click(pushSlider(inputs[i], -0.01));
      $('#x'+(i+1)+'-dnn').click(pushSlider(inputs[i], -0.1));
      inputs[i].addEventListener('keydown', function(e) {
        switch(e.which) {
          case 38: // key up
            pushSlider(this, 0.01)();
            break;
          case 33: // page up
            pushSlider(this, 0.1)();
            break;
          case 40: // key down
            pushSlider(this, -0.01)();
            break;
          case 34: // page down
            pushSlider(this, -0.1)();
            break;
        }
      });
    }
    update_time();
    update_task(new Array(round.num_outputs).fill(0));
  };

  function format_time(t) {
    var minutes = Math.floor(t/1000/60).toString();
    var seconds = Math.floor(t/1000%60).toString();
    var milliseconds = ((t%1000*60)*10).toString().substring(0,1);
    return (minutes.length == 1 ? '0'+minutes : minutes) + ':' + (seconds.length == 1 ? '0'+seconds : seconds) + '.' + milliseconds;
  }
  function update_time(t) {
    if(t == null && round.max_time == null) {
      $('#timeContainer').addClass('d-none');
    } else {
      $('#timeContainer').removeClass('d-none');
      if(t < round.max_time/10) {
        $('#timeContainer').removeClass('alert-secondary');
        $('#timeContainer').removeClass('alert-warning');
        $('#timeContainer').addClass('alert-danger');
      } else if(t < round.max_time/4) {
        $('#timeContainer').removeClass('alert-secondary');
        $('#timeContainer').removeClass('alert-danger');
        $('#timeContainer').addClass('alert-warning');
      } else {
        $('#timeContainer').removeClass('alert-warning');
        $('#timeContainer').removeClass('alert-danger');
        $('#timeContainer').addClass('alert-secondary');
      }
      if(t == null) {
        $('#time').text(format_time(round.max_time));
      } else {
        $('#time').text(format_time(t));
      }
    }
  }

  function update_task(y) {
    for(var i = 0; i < y.length; i++) {
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
