var ZOOM_ADJUST = 10;                                // change in width per zoom click 
var DEBUG = true;

var	LEADIN_TIME = 2000;                              // give 2 second lead-in time
var END_TIME;
var SCROLLPERIOD = 10000;                            // initialized and modified based on SPEED;
var PIXELS_PER_MS;                                   // initialized upon load
var TIMER_INTERRUPT = 80;                            // in ms, dictates how frequently we look at current actual note vs. tab note for scoring
var PLAY = false;
var CURRENT_TIME = 0;                                // increments with scroll so that we know where in music we are 
var SCROLL_INDEX = 0;
var END_TIME = 0;                                    // set based on loaded tab

var NUM_STRINGS = 6;
var NUM_FRETS = 22;
var SCORE = 0;
var MISS_PENALTY = 1;
var HIT_REWARD = 10;

var CONNECTION_STATUS = 0;                          

var SCREEN_WIDTH;
var SCREEN_HEIGHT;

var activeStrings = [];
var Tab = [];                                       // Tab is 2-d array - string number, time
var activeTabIndex = [];

var scoring_interrupt;


$(function() {
  
	init();
});

function init() {
	
	for(var i=0; i<NUM_STRINGS; i++) {
		Tab[i] = [];
	}

	SCREEN_WIDTH = $(window).width();
	SCREEN_HEIGHT = $(window).height();
	PIXELS_PER_MS = SCREEN_WIDTH/SCROLLPERIOD;

	if(!DEBUG) {
		$('.debug').hide();
	}
  
	loadTab();
	drawFretboard();
	drawGuitarFretboardFretMarkers();
	showTab();
  
	debugOut(1000*PIXELS_PER_MS + 'pixels/sec scroll rate');
	
	app.initialize();                        // index.js
	
	reset();
}

function reset() {
	
	CURRENT_TIME = 0;                               
	SCROLL_INDEX = 0;
	SCORE = 0;
	
	$('.tab_marker').css('left',$('body').css('margin-left'));
	
	initActual();
	initActiveTabs();	
	//updateScoreAndFretboard(); // need
	$('.tab_string_circle').hide().removeClass('.tab_string_circle_hit').removeClass('.tab_string_circle_miss');
	
}

function initActiveTabs() {

	for(var i=0; i<NUM_STRINGS; i++) {
		activeTabIndex[i] = 0;
	}
}

$('#reset_tab').click(function() {

		reset();
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

function iterateTabMarker() {

	SCROLL_INDEX++;
	$('.scrollstring').css('margin-left','-' + $('.scrollstring').outerWidth() + 'px');
	
}

function moveTabMarker() {
	
	$('.tab_marker').css('left',$('body').css('margin-left').replace('px',''));
	$('.tab_marker').animate(
		{'left': '+=' + SCREEN_WIDTH},
		SCROLLPERIOD, 'linear', moveTabMarker);
}

var Note = function(string, fret, is_silent, timeInMs) {

	this.string = string;
	this.fret = fret;
	this.is_silent = is_silent;
	this.time = timeInMs;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// duration is unitless - minimum value is 1, no max value
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function writeNote(string, fret, timeInMs) {
         
	var thisnote = new Note(string, fret, false, timeInMs);
	Tab[(string-1)].push(thisnote);
}

function writeStringSilence(string, timeInMs) {

	var thisnote = new Note(string, 0, true, timeInMs);
	Tab[(string-1)].push(thisnote);
	
}

function writeWholeSilence(duration) {	

	// whole silence will begin from the END of the last current note so that time resumption of non-silence is not string-dependent
}

function loadTab() {

	debugOut('Loading Tab...');

	NUM_NOTES = 6;
	
	// write intro silence starting at time 0
	for(var k=0;k<NUM_NOTES;k++) {
		writeStringSilence(k+1,0);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////
	
	// offset notes by LEADIN_TIME
	for(var k=0;k<NUM_NOTES;k++) {
		writeNote((k%6)+1,k,LEADIN_TIME);
	}
	for(var k=0;k<NUM_NOTES;k++) {
		writeNote(((k+3)%6)+1,k+3,LEADIN_TIME+5000);
	}
    writeNote(3,5,LEADIN_TIME+8000);
    writeNote(4,8,LEADIN_TIME+9800);
	/////////////////////////////////////////////////////////////////////////////////////////////
		
	// wite outro silence - 
	var maxindex = 0;
	
	for(var k=0;k<NUM_NOTES;k++) {
		if(Tab[k][Tab[k].length-1].time > Tab[maxindex][Tab[maxindex].length-1].time) {
			maxindex = k;
		}
	}
	var lastnote_time = Tab[maxindex][Tab[maxindex].length-1].time;
	
	for(var k=0;k<NUM_NOTES;k++) {
		writeStringSilence(k+1,lastnote_time+2000);
		writeStringSilence(k+1,lastnote_time+2200);
		writeStringSilence(k+1,lastnote_time+2400);
		writeStringSilence(k+1,lastnote_time+2600);
		writeStringSilence(k+1,lastnote_time+2800);
		writeStringSilence(k+1,lastnote_time+SCROLLPERIOD);
	}
	
	END_TIME = lastnote_time + 3000;
	
	debugOut('Tab Load Complete...');	
	
}

function showTab() {

	debugOut('Showing Tab...');

	for(i=0; i < NUM_STRINGS; i++) {
		for(j=0; j < (Tab[i].length-1); j++) {
		    thisnote = Tab[i][j];
			width = (Tab[i][j+1].time - thisnote.time)*PIXELS_PER_MS;
		    html_transcribe = '<div class="tab_note" style="width:' + width + 'px">' + (thisnote.is_silent ? 'x':thisnote.fret) + '</div>';
		    $('#string_'+(i+1)).append(html_transcribe);    
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
	var fretheight = Math.floor(fretinnerwidth*0.45);
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
	scoring_interrupt = setInterval(updateScoreAndFretboard,TIMER_INTERRUPT);
	moveTabMarker();
}

function pause() {

	PLAY = false;
	$('#play_tab').show();
	$('.tab_marker').stop();
	clearInterval(scoring_interrupt);
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

	if($('.tab_note').outerWidth() > ZOOM_ADJUST) {
		$('.tab_note').css('width',($('.tab_note').outerWidth()-ZOOM_ADJUST)+'px');
		debugOut('Zoom Down: ' + $('.tab_note').css('width'));
	}
}

function zoomUp() {

	$('.tab_note').css('width',($('.tab_note').outerWidth()+ZOOM_ADJUST)+'px');
	debugOut('Zoom Up: ' +  $('.tab_note').css('width'))
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ACTUAL notes input:
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function initActual() {

	for(var i=0; i<NUM_STRINGS; i++) {
		activeStrings[i] = -1;                    // -1 means string silent
		placeFinger(i+1,0);
	}
}

function placeFinger(string, fret) {

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

	CURRENT_TIME = Math.floor((SCROLL_INDEX*$('.scrollstring').outerWidth() + $('.tab_marker').css('left').replace('px','')-$('body','html').css('margin-left').replace('px',''))/PIXELS_PER_MS);
	
	if(CURRENT_TIME >= END_TIME)
		pause();
		
	$('.tab_string_circle').hide().removeClass('.tab_string_circle_hit').removeClass('.tab_string_circle_miss');
	
	for(var i=0; i<NUM_STRINGS; i++) {
		
		fret = activeStrings[i];
		string = i+1;
		
		if(CURRENT_TIME > Tab[i][activeTabIndex[i]+1].time) {		
		    activeTabIndex[i] = activeTabIndex[i]+1;
		}
			
		// determine whether the note matches tab
		if(Tab[i][activeTabIndex[i]].is_silent) {
			if(fret == -1)
				hitSilence(string, fret);
			else
				missSilent(string,fret);
		}
		else {
			// show tab position on fretboard
			$('#tab_string' + Tab[i][activeTabIndex[i]].string + '_fret' + Tab[i][activeTabIndex[i]].fret).show();
		
			if(fret != Tab[(string-1)][activeTabIndex[i]].fret)
				missNote(string, fret, Tab[(string-1)][activeTabIndex[i]].string, Tab[(string-1)][activeTabIndex[i]].fret);
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
// Data Handling
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function processData(data) {
	
	
}

function updateConnectStatus(status) {

	switch(status) {
		case 1:
			$('#connect_status').css('border','5px solid yellow');
			break;
		case 2:
			$('#connect_status').css('border','5px solid green');
			break;
		case 3:
			alert('Uh oh - lost Bluetooth connection!');
			$('#connect_status').css('border','5px solid red');
			break;

	}
	
}
 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DEBUG
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function debugOut(string_info) {

	$('#diag1').append(string_info + '<br>');
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
 
			

