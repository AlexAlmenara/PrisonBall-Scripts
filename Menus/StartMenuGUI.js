#pragma strict

var gSkin : GUISkin;

var background : Texture2D; // our backdrop image goes in here
private var isLoading = false; // if true, we'll display the "Loading..." message



function OnGUI() {
	if (gSkin)
		GUI.skin = gSkin;
	else
		Debug.Log("StartMenuGUI: GUI Skin object missing!");
		
	var backgroundStyle : GUIStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background;
	GUI.Label ( Rect( (Screen.width - (Screen.height * 2)) * 0.75, 0, Screen.height * 2, Screen.height), "", backgroundStyle); //the background image fills all the screen

	GUI.Label ( Rect( (Screen.width/2)-197, 50, 400, 100), "Prison Ball", "mainMenuTitle"); //the title of the menu
	
	//button Play
	if (GUI.Button( Rect( (Screen.width/2)-70, Screen.height - 160, 140, 70), "Play")) {
		isLoading = true;
		Application.LoadLevel("ModeMenu"); // load the game level.
	}
	
	
	//button Quit
	var isWebPlayer = (Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.WindowsWebPlayer);
	if (!isWebPlayer) { //the button Quit only works in standalone mode. if is Web, we could argue to close the the browser
		if (GUI.Button( Rect( (Screen.width/2)-70, Screen.height - 80, 140, 70), "Quit")) {
			print("Quit application");
			Application.Quit(); //it only works in build mode, no in edit mode
		}
	}
	
	//Loading...
	if (isLoading)
		GUI.Label ( Rect( (Screen.width/2)-110, (Screen.height / 2) - 60, 400, 70), "Loading...", "mainMenuTitle");

}

/*function Start () {
	Application.
}*/

/*function Update () {

}*/


// Make the script also execute in edit mode
@script ExecuteInEditMode()
