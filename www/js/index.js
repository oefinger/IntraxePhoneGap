var ZOOM_ADJUST = 10;                                // change in width per zoom click 
var DEBUG = true;

var SCROLLPERIOD = 500;                              // initialized and modified based on SPEED;
var PLAY = false;
var CURRENT_TIME = 0;                                // increments with scroll so that we know where in music we are 
var END_TIME = 0;                                    // set based on loaded tab
var END_PADDING = 30;                                // number of empty/silent notes to add at end of tab

var NUM_STRINGS = 6;
var NUM_FRETS = 22;
var SCORE = 0;
var MISS_PENALTY = 0.5;
var HIT_REWARD = 1;

var SCREEN_WIDTH;
var SCREEN_HEIGHT;

$(function() {
  
  SCREEN_WIDTH = $(window).width();
  SCREEN_HEIGHT = $(window).height();
  
  if(!DEBUG) {
	$('.debug').hide();
  }
  
  initActual();
  loadTab();
  drawFretboard();
  drawGuitarFretboardFretMarkers();
  
  showTab();
      
});

$('#play_tab').click(function() {

		play();
});
	
$('#pause_tab').click(function() {

		pause();
});

$('#speed_up').click(function() {

		speedUp();
});

$('#slow_down').click(function() {

		slowDown();
});

$('#zoom_down').click(function() {

		zoomDown();
});

$('#zoom_up').click(function() {

		zoomUp();
});


function scrollManager() {
	
	if(PLAY && CURRENT_TIME < END_TIME) {
		updateScoreAndFretboard();
		scrollLeft();
	}
	
	if(CURRENT_TIME >= END_TIME-END_PADDING) {
		pause();
	}
	
	
}

function scrollLeft() {
	
	debugOut("Current Time: " + CURRENT_TIME);
	
	$('.scrollstring').velocity(
        {'margin-left': '-=' + $('.tab_note').css('width')},
        SCROLLPERIOD, 'linear', scrollManager);
	
	CURRENT_TIME++
	
}
	

// Tab is 2-d array - string number, time
var Tab = [];

for(var i=0; i<NUM_STRINGS; i++) {

	Tab[Tab.length] = [];
}

var Note = function(string, fret, is_ringing, is_silent) {

	this.string = string;
	this.fret = fret;
	this.is_ringing = is_ringing;
	this.is_silent = is_silent;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// duration is unitless - minimum value is 1, no max value
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function writeNote(string, fret, duration) {
         
	for(var i=0; i<duration; i++) {
		var thisnote = new Note(string, fret, i>0, false);
		Tab[(string-1)].push(thisnote);
	}
}

function writeChord(notes, duration) {

}

function writeStringSilence(string, duration) {

	for(var i=0; i<duration; i++) {
		var thisnote = new Note(string, 0, false, true);
		Tab[(string-1)].push(thisnote);
	}
}

function writeWholeSilence(duration) {	

	// whole silence will begin from the END of the last current note so that time resumption of non-silence is not string-dependent
}

function loadTab() {

	debugOut('Loading Tab...');
	
	// prepend with silence
	for(var i=NUM_STRINGS; i>=1;i--) {
		writeStringSilence(i,5);
	}
	
	for(var k=0;k<10;k++) {
		writeNote(1,(k%6)+1,1);
	}
	writeNote(2,4,3);
	
	debugOut('Tab Load Complete...');
		
	// pad end with silence
	for(var i=NUM_STRINGS; i>=1;i--) {
		writeStringSilence(i,END_PADDING);
		if(Tab[(i-1)].length > END_TIME)
			END_TIME = Tab[(i-1)].length; 
	}
	for(var i=NUM_STRINGS; i>=1;i--) {
		var diff = END_TIME-Tab[(i-1)].length;
		if(diff > 0)
			writeStringSilence(i,diff);
	}
	
}

function showTab() {

	debugOut('Showing Tab...');
	
	// write to DOM for HTML presentation
	for(var i=NUM_STRINGS; i >= 1; i--) {
		for(var j=0; j < Tab[(i-1)].length; j++) {
		    var html_transcribe = '<div class="tab_note">' + (Tab[(i-1)][j].is_silent ? '&nbsp;':Tab[(i-1)][j].fret) + '</div>';
			$('#string_'+i).append(html_transcribe);    
		}
	}
}


function drawFretboard() {
		
	for(var i=NUM_STRINGS; i>=1; i--) {
		$('#fretboard').append('<div class="row fretboard_row"><div id="string_fretboard_"' + i + ' class="fretboard_segment">');
		$('#fretboard').append('<div id="string' + i + '_fret0" class="nut"><div id="fingerplacement_string' + i + '_fret0" class="unplayed_string_circle unplayed_string_circle_fret0"></div><div id="tab_string' + i + '_fret0" class="tab_string_circle tab_string_circle_fret0"></div></div>');
		
		for(var j=1; j <= NUM_FRETS; j++) {
			$('#fretboard').append('<div id="string' + i + '_fret' + j + '" class="fret ' + (j==NUM_FRETS ? 'last_fret':'') + '"><div id="fingerplacement_string' + i + '_fret' + j + '" class="unplayed_string_circle"></div><div id="tab_string' + i + '_fret' + j + '" class="tab_string_circle"></div></div>');
		}
		
		$('#fretboard').append('</div></div>');
	}

	// non-string lower segment
	$('#fretboard').append('<div class="row fretboard_row"><div id="string_fretboard_0 class="fretboard_segment">');
	$('#fretboard').append('<div id="string' + i + '_fret0" class="nut"></div>');
	
	for(var j=1; j <= NUM_FRETS; j++) {
		$('#fretboard').append('<div id="stringX_fret' + j + '" class="fret ' + (j==NUM_FRETS ? 'last_fret':'') + '"></div>');
	}
		
	$('#fretboard').append('</div></div>');
		
	// determine spacing - include nut in calculation
	
	var screenpadding = (parseInt($('body').css('margin-left').replace('px','')) + parseInt($('body').css('margin-right').replace('px','')));
	var tmp = (SCREEN_WIDTH-screenpadding)/(NUM_FRETS + 2);
	var nutinnerwidth = Math.floor(tmp*0.35);
	var nutouterwidth = nutinnerwidth + $('.nut').outerWidth()-$('.nut').innerWidth();
	var fretouterwidth =  Math.floor((SCREEN_WIDTH-screenpadding-nutouterwidth)/NUM_FRETS);
	var fretinnerwidth = fretouterwidth - ($('.fret').outerWidth() - $('.fret').innerWidth());
	var fretheight = Math.floor(fretinnerwidth*0.40);
	var circlediameter = Math.floor(fretheight/2);
	var circleborderradius = $('.unplayed_string_circle').css('border-top-width').replace('px','');
	$('.nut').css('width', nutinnerwidth+'px').css('height',fretheight+'px');
	$('.fret').css('width', fretinnerwidth+'px').css('height',fretheight+'px');
	$('.unplayed_string_circle').css('height',circlediameter+'px').css('width',circlediameter+'px').css('border-radius',circlediameter+'px').css('margin-top',(fretheight-circlediameter/2-circleborderradius)+'px').css('margin-left',(fretinnerwidth-circlediameter-circleborderradius)/2 +'px');
    $('.unplayed_string_circle_fret0').css('margin-left',(nutinnerwidth-circlediameter-circleborderradius)/2 +'px');
	$('.tab_string_circle').css('height',circlediameter+'px').css('width',circlediameter+'px').css('border-radius',circlediameter+'px').css('margin-top',(fretheight-circlediameter/2-circleborderradius)+'px').css('margin-left',(fretinnerwidth-circlediameter-circleborderradius)/2 +'px');
    $('.tab_string_circle_fret0').css('margin-left',(nutinnerwidth-circlediameter-circleborderradius)/2 +'px');
	
	// determine whether last fret needs to be widened to touch right edge of screen
	var pixels_remaining = SCREEN_WIDTH - screenpadding - nutouterwidth - NUM_FRETS*fretouterwidth;
	var new_width_last_fret = parseInt($('.fret').css('width').replace('px',''))+pixels_remaining;
	$('last_fret').css('width',new_width_last_fret+'px');
	
}

function drawGuitarFretboardFretMarkers() {

	$('#string3_fret3').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string3_fret5').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string3_fret7').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string3_fret9').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string2_fret12').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string4_fret12').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string3_fret15').append('<div class="guitar_fretboard_marker_circle"></div>');
	$('#string3_fret17').append('<div class="guitar_fretboard_marker_circle"></div>');
		
	// determine spacing - include nut in calculation
	var fretwidth = parseInt($('.fret').css('width').replace('px',''));
	var fretheight = parseInt($('.fret').css('height').replace('px',''));
	var circlediameter = Math.floor(fretheight/2);
	var circleborderradius = parseInt(Math.floor($('.guitar_fretboard_marker_circle').css('border-top-width').replace('px','')));
	$('.guitar_fretboard_marker_circle').css('height',circlediameter+'px').css('width',circlediameter+'px').css('border-radius',circlediameter+'px').css('margin-top',(fretheight-circlediameter-circleborderradius)/2 +'px').css('margin-left',(fretwidth-circlediameter-circleborderradius)/2 +'px');

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TAB notes and control: duration is now in a context of SPEED variable
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function play() {

	$('#play_tab').hide();
	PLAY = true;
	debugOut('PLAY'); 
	scrollLeft(); //scrollManager();
}

function pause() {

	PLAY = false;
	$('#play_tab').show();
	debugOut('PAUSE');		
}

function speedUp() {

	SCROLLPERIOD *= 0.9;
	updateScrollPeriod();
	debugOut('Speed Up');
}

function slowDown() {

	SCROLLPERIOD *= 1.1;
	updateScrollPeriod();
	debugOut('Slow Down');
}

function zoomDown() {

	$('.note').css('width',(parseInt($('.note').css('width'))-ZOOM_ADJUST)+'px');
	debugOut('Zoom Down: ' + $('.note').css('width') + 'px');
}

function zoomUp() {

	$('.note').css('width',(parseInt($('.note').css('width'))+ZOOM_ADJUST));
	debugOut('Zoom Up: ' +  $('.note').css('width'))
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ACTUAL notes input:
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var activeStrings = [];

function initActual() {

	for(var i=0; i<NUM_STRINGS; i++)
		activeStrings.push(-1);                    // -1 means string silent
}

function placeFinger(string, fret) {

	resetFingers();
	$('#fingerplacement_string' + string + '_fret' + fret).show();
}

function resetFingers() {

	$('.unplayed_string_circle').hide();
}

function playNote(string, fret) {

	$('#fingerplacement_string' + string + '_fret' + fret).removeClass('played_string_circle_miss').removeClass('played_string_circle_hit');
	activeStrings[(string-1)] = fret;
	updateScoreAndFretboard();
}

function stopNote(string, fret) {

	$('#fingerplacement_string' + string + '_fret' + fret).removeClass('played_string_circle_miss').removeClass('played_string_circle_hit');
	activeStrings[(string-1)] = -1;
	updateScoreAndFretboard();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tab vs. actual scoring events
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function updateScoreAndFretboard() {

	$('.tab_string_circle').hide().removeClass('.tab_string_circle_hit').removeClass('.tab_string_circle_miss');
	
	for(var i=0; i<NUM_STRINGS; i++) {
		
		fret = activeStrings[i];
		string = i+1;
		
		// determine whether the note matches tab
		if(Tab[i][CURRENT_TIME].is_silent) {
			if(fret == -1)
				hitSilence(string, fret);
			else
				missSilent(string,fret);
		}
		else {
			// show tab position on fretboard
			$('#tab_string' + Tab[i][CURRENT_TIME].string + '_fret' + Tab[i][CURRENT_TIME].fret).show();
		
			if(fret != Tab[(string-1)][CURRENT_TIME].fret)
				missNote(string, fret, Tab[(string-1)][CURRENT_TIME].string, Tab[(string-1)][CURRENT_TIME].fret);
			else
				hitNote(string,fret)
		}
		
	}
	
	$('#score').html(SCORE);
	
}

function missSilent(string, fret) {
	
	$('#fingerplacement_string' + string + '_fret' + fret).addClass('played_string_circle_miss');
	$('#string_score_' + string + '_miss').show();
	SCORE -= (SCORE >= MISS_PENALTY ? MISS_PENALTY:0);                                         // cap minimum score at 0
}

function missNote(string, fret, string_tab, fret_tab) {

    // played wrong string or played during silent
	if($('#fingerplacement_string' + string + '_fret' + fret).is(':visible')) {
		$('#fingerplacement_string' + string + '_fret' + fret).addClass('played_string_circle_miss');
	}
	if($('#tab_string' + string_tab + '_fret' + fret_tab).is(':visible')) {
		$('#tab_string' + string_tab + '_fret' + fret_tab).addClass('tab_string_circle_miss');
	}
	
	// missed a note that should have been played
	
	$('#fingerplacement_string' + string + '_fret' + fret).addClass('played_string_circle_miss');
	$('#string_score_' + string + '_miss').show();
	SCORE -= (SCORE >= MISS_PENALTY ? MISS_PENALTY:0);                                         // cap minimum score at 0
}

function hitSilence(string, fret) {

	//$('#fingerplacement_string' + string + '_fret' + fret).addClass('played_string_circle_hit');
	//$('#string_score_' + string + '_hit').show();
}

function hitNote(string, fret) {

	$('#fingerplacement_string' + string + '_fret' + fret).addClass('played_string_circle_hit');
	$('#string_score_' + string + '_hit').show();
	SCORE += HIT_REWARD;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DEBUG
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function debugOut(string_info) {

	$('#diag1').html(string_info + '<br>');
}

$('#simulate_finger_on').click(function() {

	placeFinger($('#selected_string').val(),$('#selected_fret').val());
});

$('#simulate_finger_off').click(function() {

	resetFingers();
});

$('#simulate_string_play').click(function() {

	playNote($('#selected_string').val(),$('#selected_fret').val());
});
  
$('#simulate_string_mute').click(function() {

	stopNote($('#selected_string').val(),$('#selected_fret').val());
});
 
			

