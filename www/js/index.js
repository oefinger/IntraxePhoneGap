var ZOOM_ADJUST = 10;                                // change in width per zoom click 
var DEBUG = false;

var SCROLLPERIOD = 500;                              // initialized and modified based on SPEED;
var PLAY = false;
var CURRENT_TIME = 0;                                // increments with scroll so that we know where in music we are 
var END_TIME = 0;                                    // set based on loaded tab

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
		updateScore();
		scrollLeft();
	}
	
	if(CURRENT_TIME == END_TIME) {
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
	
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// duration is unitless - minimum value is 1, no max value
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
	for(var k=0;k<10;k++) {
		writeNote(1,(k%6)+1,1);
	}
	writeNote(2,4,3);
	
	debugOut('Tab Load Complete...');
		
	// pad end with silence
	for(var i=NUM_STRINGS; i>=1;i--) {
		writeStringSilence(i,10);
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
		$('#fretboard').append('<div class="row"><div id="string_fretboard_"' + i + ' class="fretboard_segment">');
		$('#fretboard').append('<div id="string' + i + '" class="nut"></div>');
		
		for(var j=0; j <= NUM_FRETS; j++) {
			$('#fretboard').append('<div id="string' + i + '_fret' + j + '" class="fret"><div class="circle"></div></div>');
		}
		
		$('#fretboard').append('</div></div>');
	}

	// non-string lower segment
	$('#fretboard').append('<div class="row"><div id="string_fretboard_"' + i + ' class="fretboard_segment">');
	$('#fretboard').append('<div id="stringX" class="nut"></div>');
	
	for(var j=0; j <= NUM_FRETS; j++) {
		$('#fretboard').append('<div id="stringX_fret' + j + '" class="fret"></div>');
	}
		
	$('#fretboard').append('</div></div>');
		
	// determine spacing - include nut in calculation
	var tmp = SCREEN_WIDTH/(NUM_FRETS + 2);
	var nutwidth = tmp*0.35;
	var fretwidth = (SCREEN_WIDTH-nutwidth)/(NUM_FRETS+3);
	var fretheight = fretwidth*0.40;
	$('.nut').css('width', nutwidth+'px').css('height',fretheight+'px');;
	$('.fret').css('width', fretwidth+'px').css('height',fretheight+'px');
	
	$('.circle').css('height',fretheight/3+'px').css('width',fretheight/3+'px').css('border-radius',fretheight/3+'px');
	
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
	$('.score_hit').hide();
	$('.score_miss').hide();
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

function noteOn(string, fret) {

	activeStrings[(string-1)] = fret;
	updateScore();
	var id = 'string'+string+'_active';
	$('#'+id).removeClass('string_off').addClass('string_on').html(fret);

}

function noteOff(string, fret) {

	activeStrings[(string-1)] = -1;
	updateScore();
	var id = 'string'+string+'_active';
	$('#'+id).removeClass('string_on').addClass('string_off').html('&nbsp;');
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Tab vs. actual scoring events
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function updateScore() {

	$('.score_hit').hide();
	$('.score_miss').hide();
	
	for(var i=0; i<NUM_STRINGS; i++) {
		
		fret = activeStrings[i];
		string = i+1;
		
		// determine whether the note matches tab
		if(Tab[i][CURRENT_TIME].is_silent) {
			if(fret == -1)
				HitSilence(string, fret);
			else
				missSilent(string,fret);
		}
		else {
			if(fret != Tab[(string-1)][CURRENT_TIME].fret)
				missFret(string, fret);
			else
				HitFret(string,fret)
		}
		
	}
	
	$('#score').html(SCORE);
	
}

function missSilent(string, fret) {
	//debugOut('MISS: String ' + string + ' should be silent');
	$('#string_score_' + string + '_miss').show();
	SCORE -= (SCORE >= MISS_PENALTY ? MISS_PENALTY:0);                                         // cap minimum score at 0
}

function missFret(string, fret) {
	//debugOut('MISS: String ' + string + ' should be ' + Tab[(string-1)][CURRENT_TIME].fret);
	$('#string_score_' + string + '_miss').show();
	SCORE -= (SCORE >= MISS_PENALTY ? MISS_PENALTY:0);                                         // cap minimum score at 0
}

function HitSilence(string, fret) {
	//debugOut('HIT!');
	$('#string_score_' + string + '_hit').show();
}

function HitFret(string, fret) {
	//debugOut('HIT!');
	$('#string_score_' + string + '_hit').show();
	SCORE += HIT_REWARD;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DEBUG
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function debugOut(string_info) {
	$('#diag1').html(string_info + '<br>');
}

$('#simulate_string_play').click(function() {
		noteOn($('#selected_string').val(),$('#selected_fret').val());
});
  
$('#simulate_string_mute').click(function() {
		noteOff($('#selected_string').val(),$('#selected_fret').val());
});
 
			

