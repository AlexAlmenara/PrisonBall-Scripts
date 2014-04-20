#pragma strict

var guiSkin : GUISkin;
var drawer : GUIDrawer = new GUIDrawer();

var background : Texture2D; // our backdrop image goes in here
private var backgroundStyle : GUIStyle;
var loadingStyle: GUIStyle;
//private var isLoading = false; // if true, we'll display the "Loading..." message

static var MAX_NPLAYERS_TEAM = 6; //numero maximo de jugadores por equipo


class Configuration { //configuration to send to PrisonRules.js
	var nPlayersTeam = 1; //number of player per team
	var nControlled1 = 1; //number of gamers in team 1: players controlled by keyboard, joystick or kinect
	var nControlled2 = 0; //idem for team 2. allowed combinations: (0, 1), (1, 1), (2, 0)
	var fifa = true; //FIFA behavour: for each ball caught will be a change of controllers
	var kinect = false; //kinect enabled or not. default 0: not
	var revive = true; //can revive players (rule: when a burned player hits an opponent, he will revived)
};

static var config : Configuration = new Configuration();

private var currentScreen = 1; //1: number of gamers, 2: simple options, 3: all options, 4: players, 5: loading and show instructions

private var controlString = "Be any of the players of your team"; //fifa
private var inputString = "Keyboard"; //kinect


//element features

//general
var backButtonOffset = Vector2(250, 200);
var continueButtonOffset = Vector2(250, 200); //button continue or play

//screen 1
var buttons1Width = 670;
var buttons1Offset = Vector2(0, 0);
var buttons1Separation = 30;
private var oneOffset : Vector2;
private var versusOffset : Vector2;
private var bothOffset : Vector2;

//screens 2 and 3
var nPlayersOffset = Vector2(-390, -200); //screens 2 and 3: height position of the scroll and buttons to select the number of players per team
var sliderSize = 600;

var moreOptionsOffset = Vector2(0, 100);
var inputOffset = Vector2(-630, 0);
var controlOffset = Vector2(-700, 140);

//screen 4 loading
var loadingOffset = Vector2(-200, -100);


function Awake() { //awake is called every load of this scene, so need to use OnLevelWasLoaded()
	backgroundStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background;
	
	if (config.kinect)
		inputString = "Kinect";
	else
		inputString = "Keyboard";
	
	if (config.fifa)
		controlString = "Be any of the players of your team";
	else
		controlString = "Use your own avatar";
							
	oneOffset = Vector2(buttons1Offset.x, buttons1Offset.y);
	versusOffset = Vector2(buttons1Offset.x, buttons1Offset.y + drawer.GetButtonHeight() + buttons1Separation);
	bothOffset = Vector2(buttons1Offset.x, buttons1Offset.y + 2 * (drawer.GetButtonHeight() + buttons1Separation));	
}

function OnGUI() {
	GUI.skin = guiSkin;
	drawer.IndependentResolution();
	drawer.BackgroundImage(backgroundStyle);
	
	switch (currentScreen) {
		case 1: Screen1_Gamers(); break;
		case 2: Screen2_SimpleOptions(); break;
		case 3: Screen3_AllOptions(); break;
		//TODO: case 4: Screen4_Players(); break;
		case 4: Screen4_Loading(); break;
		default: currentScreen = 1;
	}		

}


/*function OnLoad() { // this idea no works...
	Application.LoadLevel("Ground1"); // load the game level.
}*/

function GoToScreen(screen: int) {
	currentScreen = screen;
}

function Screen1_Gamers() {
	
	if (drawer.Button_Center(oneOffset, buttons1Width, "One Player")) {
		config.nControlled1 = 1;
		config.nControlled2 = 0;
		currentScreen++; //to screen 2
	}
	
	if (drawer.Button_Center(versusOffset, buttons1Width, "Player 1 vs Player 2")) {
		config.nControlled1 = 1;
		config.nControlled2 = 1;
		currentScreen++;
	}
	
	if (drawer.Button_Center(bothOffset, buttons1Width, "Players 1 and 2 both")) {
		config.nControlled1 = 2;
		config.nControlled2 = 0;
		currentScreen++;
	}
}


function Screen2_SimpleOptions() { //draws the elements: number of players, '<', slider, '>', 'more options', 'back', 'play'
	NPlayersTeam();
	
	if (drawer.Button_Center(moreOptionsOffset, 600, "More Options")) {
		currentScreen = 3; 
	}
	
	BackPlayButtons(2);
}


function Screen3_AllOptions() {
	NPlayersTeam();
	
	drawer.Label_Center(inputOffset, "Input : ");
	if (drawer.Button_Center(inputOffset + Vector2(520, drawer.GetButtonHeight()/2), 600, inputString)) {
		config.kinect = !config.kinect;
		if (config.kinect)
			inputString = "Kinect";
		else
			inputString = "Keyboard";
	}
	
	drawer.Label_Center(controlOffset, "Control : ");
	if (drawer.Button_Center(controlOffset + Vector2(850, drawer.GetButtonHeight()/2), 1120, controlString)) {
		config.fifa = !config.fifa;
		if (config.fifa)
			controlString = "Be any of the players of your team";
		else
			controlString = "Use your own avatar";
	}
	
	BackPlayButtons(2); //we have changed the parameter to 2 instead of 3: for come back to screen 1 with the Back Button
}

/*function Screen4_Players() { //TODO: select GameObjects of players
	yield;
	currentScreen = 5;
}*/

function Screen4_Loading() {
	//GUI.Label ( Rect( (Screen.width/2)-110, (Screen.height / 2) - 60, 400, 70), "Loading...", "mainMenuTitle");
	drawer.Label_Center(loadingOffset, "Loading...", loadingStyle);
}


//************* functions that draw several elements in the screen ************************************

//Show the Back and Continue buttons. The new screen after press any will depends of the current screen passed as parameter
function BackContinueButtons(screen: int) {
	if (drawer.Button_BottomLeft(backButtonOffset, 300, "Back")) {
		currentScreen = screen - 1;
	}
		
	if (drawer.Button_BottomRight(continueButtonOffset, 300, "Continue")) {
		currentScreen = screen + 1;
	}
}

//Show the Back and Play buttons. The new screen after press Back Button depends of the current screen passed as parameter
function BackPlayButtons(screen: int) {
	if (drawer.Button_BottomLeft(backButtonOffset, 300, "Back")) {
		currentScreen = screen - 1;
	}
		
	if (drawer.Button_BottomRight(continueButtonOffset, 300, "Play!")) {
		currentScreen = 4;
		Application.LoadLevel("Ground1");
	}
}

/* Draws the elements necessary to set the number of players per team:
   - Label with the current number of players
   - Buttons '<' and '>' for decrease and increase respectively
   - A horizontal slider as a alternative method to change the value. 
 */
function NPlayersTeam() { 
	drawer.Label_Center(nPlayersOffset + Vector2(100, -200), "Players per team :  " + config.nPlayersTeam.ToString());
	
	if ((drawer.Button_Center(Vector2(nPlayersOffset.x, nPlayersOffset.y), drawer.GetButtonHeight(), "<")) && (config.nPlayersTeam > 1)) //width equal to height
		config.nPlayersTeam--;
	
	config.nPlayersTeam = GUI.HorizontalSlider( //we consider that the position of slider is the left edge
		Rect(nPlayersOffset.x + drawer.GetButtonHeight() + drawer.GetResolutionWidth()/2, nPlayersOffset.y + drawer.GetResolutionHeight()/2,
		sliderSize, drawer.GetButtonHeight()), config.nPlayersTeam, 1, MAX_NPLAYERS_TEAM
	);
	
	if ((drawer.Button_Center(Vector2(nPlayersOffset.x + sliderSize + drawer.GetButtonHeight()*2, nPlayersOffset.y), drawer.GetButtonHeight(), ">")) && (config.nPlayersTeam < MAX_NPLAYERS_TEAM))
		config.nPlayersTeam++;
}


@script ExecuteInEditMode() //Make the script also execute in edit mode
