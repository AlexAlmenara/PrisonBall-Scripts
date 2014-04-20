#pragma strict

var gSkin : GUISkin;

var background : Texture2D; // our backdrop image goes in here
private var isLoading = false; // if true, we'll display the "Loading..." message

//global variables to send to PrisonRules.js
static var nControlled1 = 1; //number of gamers in team 1: players controlled by keyboard, joystick or kinect
static var nControlled2 = 0; //idem for team 2. allowed combinations: (0, 1), (1, 1), (2, 0)
static var myvar = 3;

function OnGUI() {
	if (gSkin)
		GUI.skin = gSkin;
	else
		Debug.Log("StartMenuGUI: GUI Skin object missing!");
		
	var backgroundStyle : GUIStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background;
	GUI.Label ( Rect( (Screen.width - (Screen.height * 2)) * 0.75, 0, Screen.height * 2, Screen.height), "", backgroundStyle); //the background image fills all the screen

	GUI.Label ( Rect( (Screen.width/2)-197, 50, 400, 100), "Prison Ball", "mainMenuTitle"); //the title of the menu
	
	//button One Player
	if (GUI.Button( Rect( (Screen.width/2)-70, Screen.height - 240, 650, 70), "One Player")) {
		LoadGround(1, 0);
	}
	
	
	//button Two Players vs
	if (GUI.Button( Rect( (Screen.width/2)-70, Screen.height - 160, 650, 70), "Player 1 vs Player 2")) {
		LoadGround(1, 1);
	}
	
	//button Two Players both
	if (GUI.Button( Rect( (Screen.width/2)-70, Screen.height - 80, 650, 70), "Players 1 and 2 both")) {
		LoadGround(2, 0);
	}
	
	
	//Loading...
	if (isLoading)
		GUI.Label ( Rect( (Screen.width/2)-110, (Screen.height / 2) - 60, 400, 70), "Loading...", "mainMenuTitle");

}


function LoadGround(n1 : int, n2: int) {
	isLoading = true;
	nControlled1 = n1;
	nControlled2 = n2;
	//XXX: kinect, fifa
	print("LOAD GROUND");
	Application.LoadLevel("Ground1"); // load the game level.
}

// Make the script also execute in edit mode
@script ExecuteInEditMode()
