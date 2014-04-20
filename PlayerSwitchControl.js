#pragma strict

/*
 There're functions to change the control of player: Key Player, Intelligent Player or Kinect Player.
*/

static var IA_PLAYER = 1;
static var KEY_PLAYER = 2; 
static var KINECT_PLAYER = 3;

private var control : int; //mode of control: artificial intelligence, keyboard or kinect. by default will be IA_PLAYER. need to start as 0 for call SetIAPlayer()

var gamer = 0; //gamer who controls him. 1 or 2. 0: no gamer
private var showGamerIndicator = false;
private var busy = false; 


function PassiveStart() {
	// like SetIAPlayer() but manually set components. By default is a player controlled by the system (with IA behavours)
	busy = true;
	gameObject.transform.Find("GamerIndicator").renderer.enabled = false; //by default without gamer indicator
	//DisableScript(KeyPlayer); //these scripts should be disabled at beginnig in Unity Editor
	//DisableScript(ZigSkeleton);
	control = IA_PLAYER;
	EnableScript(IAPlayer);
	UpdateGamerIndicator();
	busy = false;
}


function IsBusy() { //XXX: no used yet
	return busy;
}

function DisableScript(type: System.Type) {
	var comp = gameObject.GetComponent(type) as MonoBehaviour; //is guaranteed that type is always a script
	Input.ResetInputAxes(); //XXX
	comp.CancelInvoke(); 
	comp.StopAllCoroutines();
	comp.enabled = false;
	//yield WaitForSeconds(4);
}

function EnableScript(type: System.Type) {
	var comp = gameObject.GetComponent(type) as MonoBehaviour;
	comp.enabled = true;
}

//XXX: these functions are not used in PrisonRules.js. TODO: mejorar, no deshabilitar scripts sino poner isControllable = false
function StopControl() { //disable all the controls. note that the variable 'control' continues equal for call Reactivate() after
	busy = true;
	DisableScript(IAPlayer);
	SendMessage("SetControllable", false); //DisableScript(KeyPlayer);
	DisableScript(ZigSkeleton);
	
	if (control == KINECT_PLAYER) {
		EnableScript(PlayerAnimation); //note that we need animation if we want to move player automatically
		if (gamer == 1)
			GameObject.FindWithTag("ZigFu").SendMessage("OnUser1Blocked");
		else //gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnUser2Blocked");
	}
	yield;
	busy = false;
}

function ReactivateControl() { //after a Stop() call, enable again the last control used and if was invisible set visible again
	switch(control) {
		case KEY_PLAYER: 
			SendMessage("SetControllable", true); //yield SetKeyPlayer(gamer); 
			break; //XXX: maybe only put EnableScript...
		
		case KINECT_PLAYER: 
			DisableScript(PlayerAnimation);
			yield SetKinectPlayer(gamer); 
			if (gamer == 1)
				GameObject.FindWithTag("ZigFu").SendMessage("OnUser1Unblocked");
			else //gamer 2
				GameObject.FindWithTag("ZigFu").SendMessage("OnUser2Unblocked");
				
			break;
				
		case IA_PLAYER: yield SetIAPlayer(); break;
		default: break;
	}
	
	SendMessage("Appear");
	yield;
	Center();
}

function SetKeyPlayer(newgamer: int) { //set the control of a gamer with an keyboard and jockstick
	//print("SetKeyPlayer: " + playerName); //if (control == KEY_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop(); //XXX
	if (control == IA_PLAYER) //check last kind of control
		DisableScript(IAPlayer);
	else if (control == KINECT_PLAYER) {
		DisableScript(ZigSkeleton);
		if (gamer == 1) //last gamer to quit kinect control
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer1"); //to KinectEngageUsers //Find("/System/Zigfu").
		else // gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer2");
		
		EnableScript(PlayerAnimation);
	}
	
	//yield;
	gamer = newgamer;
	//EnableScript(PlayerAnimation);
	EnableScript(KeyPlayer); //note: the difference between gamer 1 and gamer 2 will be setted in PlayerController.js
	
	if (gamer == 1)
		SendMessage("SetKeyGamer1"); //to PlayerController
	else
		SendMessage("SetKeyGamer2");
	
	SendMessage("SetGamer", true); //to PlayerMoveController
	//TODO: SendMessage("Center"); que sirva tanto para key como para kinect
	gameObject.animation.Play("idle");
	//yield WaitForSeconds(2);
	UpdateGamerIndicator();
	control = KEY_PLAYER; //hasIA = false;
	yield;
	busy = false;
	Center(); //also center the camera
	//print("Fin SetKeyPlayer: " + playerName); 
}


function SetKinectPlayer(newgamer: int) { //set the control of a gamer with the Kinect sensor
	//print("SetKinectPlayer: " + playerName); //if (control == KINECT_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop();
	DisableScript(PlayerAnimation); //TODO: if we want to set the legs automatically we should enable this script only for them
	
	if (control == IA_PLAYER)
		DisableScript(IAPlayer);
	else if (control == KEY_PLAYER)
		DisableScript(KeyPlayer);
	
	//yield;
	gamer = newgamer;
	EnableScript(ZigSkeleton);
	if (gamer == 1)
		GameObject.FindWithTag("ZigFu").SendMessage("OnChangePlayer1", gameObject); //to KinectEngageUsers
	else //gamer 2
		GameObject.FindWithTag("ZigFu").SendMessage("OnChangePlayer2", gameObject);
	
	SendMessage("SetGamer", true); //to PlayerMoveController
	//TODO: SendMessage("Center");
	//yield WaitForSeconds(2);
	UpdateGamerIndicator();	
	control = KINECT_PLAYER;
	yield; //necessary to make the change 
	busy = false;
	Center();
	//print("Fin SetKinectPlayer: " + playerName);
}


function SetIAPlayer() { //set the control of the PC, artificial intelligence
	//print("SetIAPlayer: " + playerName); //if (control == IA_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop(); 
	if (control == KEY_PLAYER)
		DisableScript(KeyPlayer);
	else if (control == KINECT_PLAYER) {
		DisableScript(ZigSkeleton);
		if (gamer == 1)
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer1");
		else //gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer2");
			
		//EnableScript(PlayerAnimation); //XXX
	}
	
	//yield;
	gamer = 0; //no gamer
	//EnableScript(PlayerAnimation);
	EnableScript(IAPlayer);
	SendMessage("SetGamer", false); //to PlayerMoveController
	//yield WaitForSeconds(2);
	gameObject.animation.Play("idle");
	UpdateGamerIndicator();
	control = IA_PLAYER;
	yield;
	busy = false;
	//print("Fin SetIAPlayer: " + playerName);
}


function HasIA() {
	return control == IA_PLAYER; //return hasIA;
}


function SetGamerIndicatorOption(state : boolean) { //decide if you want to show or not the indicator of gamer 
	showGamerIndicator = state;
}

function UpdateGamerIndicator() { //draw or not a red or blue indicator of gamer. note: no need to use variable busy
	if (!showGamerIndicator)
		return;
	
	var indicator = gameObject.transform.Find("GamerIndicator").renderer;
		
	switch (gamer) {
		case 1: 
			indicator.enabled = true; 
			indicator.material.color = Color.blue;
			break;
		case 2: 
			indicator.enabled = true; 
			indicator.material.color = Color.red;
			break;
		default: 
			indicator.enabled = false;
	}
}


function Center() { //center camera. send message to handler (key or kinect) and then he will send message to camera
	switch(control) {
		case KEY_PLAYER: SendMessage("CenterCamera"); break;
		case KINECT_PLAYER: 
			if (gamer == 1)
				GameObject.Find("/System/ZigFu/KinectGestures1").SendMessage("Handler_CenterCamera");
			else //gamer == 2
				GameObject.Find("/System/ZigFu/KinectGestures2").SendMessage("Handler_CenterCamera");
			break;
		default: //IA_PLAYER
			break;
	}
}

@script RequireComponent(ZigSkeleton);
@script RequireComponent(IAPlayer);
@script RequireComponent(KeyPlayer);
