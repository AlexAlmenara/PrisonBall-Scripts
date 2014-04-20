#pragma strict
//Reglas del juego de Brile

/*
- Si pelota sale de campo: regresar a jugador del campo donde salio la pelota.
- Algoritmo de Brilado:
	Si alguien fue tocado: personTouched=idJugador
	Si alguien coge pelota: personTouched=0
	Si pelota toca suelo y personTouched: brilar jugador
	
- Si nBurned de algun equipo == nPlayersTeam: Fin del juego.

	
   Update() not necessary because the game rules are based in events
*/

static var MAX_NPLAYERS_TEAM = 6; //numero maximo de jugadores por equipo
static var DEFAULT_NPLAYERS_TEAM = 2; //numero por defecto de jugadores por equipo 
//static var MAX_CONTROLLERS = 2; //max number of players controlled by the gamer
static var NOPLAYER = -1;

//variables publicas: parametros
var nPlayersTeam = 1; //numero de jugadores por equipo
var nControlled1 = 1; //number of gamers in team 1: players controlled by keyboard, joystick or kinect
var nControlled2 = 0; //idem for team 2. allowed combinations: (0, 1), (1, 1), (2, 0). guaranteed in ModeMenuGUI.js
var fifa = true; //FIFA behavour: for each ball caught will be a change of controller
var kinect = false; //kinect enabled or not. default 0: not

var ball : GameObject; //pelota del juego
var camera1: GameObject; //the cameras. TODO: second camera
var camera2: GameObject;


var teamColouring = true;
var showGamerIndicator = false;

var groundSound: AudioClip;
var burnSound : AudioClip;
//XXX: var reviveSound: AudioClip;
var endSound : AudioClip;


private var s_groundC: GroundControl; //type Script, that controls the dimensions of the ground and has the getArea() function
private var s_PrisonHUD: PrisonHUD;

private var nBurned1 = 0; //number of burned player of team 1
private var nBurned2 = 0; // of team 2


private var turn = 1; //turn de equipo. 1 = equipo1, 2 = equipo2
private var turnChanged = false;
private var ownerID = NOPLAYER; //current player who has the ball
private var personTouched = NOPLAYER; //id de jugador si ha sido tocado por pelota. 0: ninguno tocado (se pone a 0 cuando alguien coge pelota)
private var personThrow = NOPLAYER; //id of last player who has thrown the ball
private var burningID = NOPLAYER; //player who is burning
private var ballGrounded = false; //if ball touches the ground. note that it's a different that ball.GetComponent(BallControl).grounded

//stopGame = private var movingToNewPosition = false; //if someone is moving to a new position (burned or revived): nobody can do anything
var timeToPosition = 5.0; //time to move to a new position (a player is burned or revived)
var runToPosition = true; //if the players auto-move to the new positions running or not
var timeGrounded = 2.0; //time to wait after touch terrain or planes. time to return to another player. for see how ball touches the ground (more realistic)

/* vector de jugadores. el identificador de cada jugador sera el indice en el que esta
  jugador i de equipo 1: identificador i
  jugador i de equipo 2: identificador nPlayersTeam + i */
private var players : GameObject []; // estatico [] es mucho mas eficiente que Array();
private var playerNames : String [];
//var players = new GameObject [nPlayersTeam*2];
//XXX: private var ss_BallPlayer = new Array(); //scripts BallPlayer for all players


/* 1 if the player is burned. 0 if not
   Notice that this vector could be in BallPlayer.js, but it's better here because of 2 reasons:
   - more efficient: not call to player.GetComponent(BallPlayer)
   - "burned" is not considered an intrinsic feauture of a person. it's a feauture of this game. 
*/
private var burned : boolean [];

//los prefab (predefinidos) para jugadores controlados por input o por inteligencia artificial
//var prefabPlayer : GameObject;
var prefabPlayer: GameObject;

private var gplayerID1 : int = NOPLAYER; //XXX: identifies the players controlled by the gamers
private var gplayerID2 : int = NOPLAYER;

private var lastGamer = 1; //in the rare case of two gamers in the team 1: alternate between them. in the case of receive from an opponent the decision will be 
//var initPosBall : Vector3; //default position of the ball: near of player 0. is public for communicate with BallControl.js

private var debugMovingPos: Vector3;

function PassiveStart() { //this Start function is only called as a message by GroundControl after UpdateDimensions() of ground
	transform.position = GameObject.FindWithTag("Ground").transform.position; //rules in the same position of ground
	
	s_PrisonHUD = gameObject.GetComponent(PrisonHUD);
	s_groundC = GameObject.FindWithTag("Ground").GetComponent(GroundControl); //notice that are two equal searches, but it isn't important here
	
	if (!camera1)
		camera1 = GameObject.Find("Camera1");
	
	if (!camera2)
		camera2 = GameObject.Find("Camera2");
		
	camera1.camera.rect = Rect(0, 0, 0.5, 1); //by default, split screen for the two cameras
	camera2.camera.rect = Rect(0.5, 0, 0.5, 1);
		
	if (!ball)
		ball = GameObject.FindWithTag("Ball"); //define the ball
	
	/*//read configuration from previus menu scences 
	nControlled1 = GameObject.Find("ModeCamera").GetComponent(ModeMenuGUI).nControlled1; //it's guaranteed the allowed combinations: (0, 1), (1, 1), (2, 0)
	nControlled2 = GameObject.Find("ModeCamera").GetComponent(ModeMenuGUI).nControlled2; //is necessary to call Find repeatdly because we cannot have a variable of script ModeMenuGUI
	//XXX: kinect, fifa, last oportunity*/
	var zigfu = GameObject.FindWithTag("ZigFu");
	
	if (kinect) {	
		s_PrisonHUD.SetKinectMessages(true);
		zigfu.SetActive(true);
		if (OneGamer())
			zigfu.SendMessage("SetNumberUsers", 1);
		else
			zigfu.SendMessage("SetNumberUsers", 2);
	}
	else {
		s_PrisonHUD.SetKinectMessages(false);
		zigfu.SetActive(false);
	}
	
	if (OneGamer())
		s_PrisonHUD.SplitScreen(false);
	else
		s_PrisonHUD.SplitScreen(true);
			
	yield;
	
	CreatePlayers(); // is called in GroundControl.js after set the initial dimensions of the ground
	
	if (groundSound)
		audio.PlayOneShot(groundSound);		
}


function CreatePlayers() { //create player and set its location in the ground
	//******* initial restrictions ******************************
	if ((nPlayersTeam <= 0) || (nPlayersTeam > MAX_NPLAYERS_TEAM)) //controlar que no se pase del limite de jugadores
		nPlayersTeam = DEFAULT_NPLAYERS_TEAM;
		
	//nControlled1 (1 or 2) and nControlled2 (0 or 1) are guaranteed correctly in ModeMenuGUI.js
	if (nControlled1 == nPlayersTeam)
		fifa = false; //don't need to use switch of controls
	
	if (nPlayersTeam == 1) //if only one player per team, it's impossible to set two gamers in team 1  
		nControlled1 = 1;
			
			
	//******* creation of players *******************************
	var defPos: Vector3; //default position of each player
	var defRot: Quaternion = Quaternion.identity; //for team 1, no rotation
	//var render : Renderer; //renderer of each player
	
	players = new GameObject [nPlayersTeam*2]; //print ("nplayers = " + players.Length);
	playerNames = new String [nPlayersTeam*2];
	
	for (var i=0; i<nPlayersTeam; i++) { //create team 1
		defPos = s_groundC.GetPosition(s_groundC.GAME1, nPlayersTeam, i);
		//defPos.y = 2; //TODO: Carl fall down
		players[i] = Instantiate(prefabPlayer, defPos, defRot); //create player. //by default IAPlayer with help position
		players[i].SendMessage("SetDefaultPosition", defPos); 
		players[i].SendMessage("SetDefaultRotation", defRot);
		players[i].SendMessage("SetPlayerID", i); 
		playerNames[i] = "player"+i;
		players[i].SendMessage("SetName", playerNames[i]);
		players[i].SendMessage("SetTeam", 1);
		
		if (teamColouring)
			for (var rend : Renderer in players[i].GetComponentsInChildren(Renderer)) //render = players[i].transform.Find("rootJoint").renderer;
				rend.material.color = Color.blue;
		
		if (showGamerIndicator)
			players[i].SendMessage("SetGamerIndicatorOption", true); //else: by default is false
			
	} //for
		
	defRot = Quaternion.Euler(0, 180, 0); //for team 2, rotation for see against the team 1. players[i+nPlayersTeam].transform.Rotate(Vector3.up, 180);
	for (i=nPlayersTeam; i<nPlayersTeam*2; i++) { //create team 2
		defPos = s_groundC.GetPosition(s_groundC.GAME2, nPlayersTeam, i-nPlayersTeam);
		//defPos.y = 2;
		players[i] = Instantiate(prefabPlayer, defPos, defRot);
		players[i].SendMessage("SetDefend"); //team 2 starts defending because team 1 starts attacking
		players[i].SendMessage("SetDefaultPosition", defPos);
		players[i].SendMessage("SetDefaultRotation", defRot);
		players[i].SendMessage("SetPlayerID", i);
		playerNames[i] = "player"+i;
		players[i].SendMessage("SetName", playerNames[i]);
		players[i].SendMessage("SetTeam", 2);
		
		
		//TODO: function SetRenderer(renderer = null, material = null, color = null)
		//var material = Resources.Load("MiMaterial", Material); //find material folder in Assets/Resources
		//var material = new Material (Shader.Find ("Transparent/Diffuse")); render.material.shader = Shader.Find("Transparent/Diffuse");
		//render = players[i].transform.Find("rootJoint").renderer; //players[i+nPlayersTeam].GetComponent(SkinnedMeshRenderer).sharedMaterial
		//var carl = Resources.Load("Carl@t-pose_2"); //Texture //print("Carl type is " + carl.GetType());
		//render.material = material;
		//render.material.mainTexture = carl; //render.material.SetTexture("_Cube", texture);
		//players[i].GetComponent(SkinnedMeshRenderer).sharedMesh = Resources.Load("HeadGeo"); //GameObject.Find("HeadGeo");
		
		if (teamColouring)
			for (var rend : Renderer in players[i].GetComponentsInChildren(Renderer)) //render = players[i].transform.Find("rootJoint").renderer;
				rend.material.color = Color.red;	
				
		if (showGamerIndicator)
			players[i].SendMessage("SetGamerIndicatorOption", true); //else: by default is false
	}
	
	
	burned = new boolean [nPlayersTeam*2];
	for (i=0; i<nPlayersTeam*2; i++)
		burned[i] = false; //by default all player are not burned
	
	/*camera1.SendMessage("SetTarget", players[firstPlayer]); //although players not prepared we can set cameras while waiting
	if (!OneGamer())
		camera2.SendMessage("SetTarget", players[nPlayersTeam]);*/
	
	//yield WaitForSeconds(3.0); //we need to wait for finish preparation of IAPlayers
	
	
	//************************** set gamers ***************************************
	//TODO: until here only we see the screen "Loading...". right now we can show the ground
	
	//Set the initial controls of players
	var firstPlayer : int = Mathf.FloorToInt(nPlayersTeam / 2.0); //playerID who starts the game
	
	SetGamer(firstPlayer, 1); //at the beginning, the player 0 is controlled by the gamer 1
		
	//second player controlled
	if (nControlled1 == 2)
		SetGamer(firstPlayer + 1, 2); //player 1 controlled by the gamer 2
	else if (nControlled2 == 1)
		SetGamer(nPlayersTeam, 2); //first player of second team controlled by gamer 2
	else { //only one gamer
		print("Only one gamer");
		camera2.SetActive(false); //desactivate second camera. deprecated: SetActiveRecursively(false);
	    camera1.camera.rect = Rect(0, 0, 1, 1);
	}

	//var initPosBall = BallPositionToPlayer(0);
	//ball.SendMessage("ShowBall", initPosBall);
	
	/*yield WaitForSeconds(2); //XXX
	BallToPlayer(firstPlayer); //ownerID = 0. at the beginning don't need to call _NonSecure or _Quit
	s_PrisonHUD.OnTurnChanged(1); //no need call UpdateTurn(0)*/
	
	//XXX prueba:
	/*var carl = GameObject.Find("CarlPlayer");
	carl.SendMessage("SetKeyPlayer", 1);
	//carl.SendMessage("SetDefend");
	camera1.SendMessage("SetTarget", carl.transform);*/
}

/*function BallToPlayer_NonSecure(playerID: int) { //if nobody has the ball, auto catch it
	yield WaitForSeconds(1); //wait if ownerID variable is not updated yet
	if ((ownerID != NOPLAYER) || (playerID == NOPLAYER)) { //if someone has the ball or player invalid, do nothing.
		print("No could pass ball to player " + playerID);
		return;
	}
	
	yield BallToPlayer(playerID);
}*/

function BallToPlayer_Quit(playerID: int) { //auto catch the ball. if someone has the ball quit it before
	if (playerID == NOPLAYER) //if player invalid, do nothing
		return;
		
	if ((ownerID != NOPLAYER) && (ownerID != playerID)) { //ball.GetComponent(BallControl).IsCaught()
		players[ownerID].SendMessage("QuitBall"); //if someone has the ball, quit it. the phsysics of ball remains desactivated 
	}
		
	yield BallToPlayer(playerID);
}

function BallToPlayer(playerID: int) { //auto catch the ball. it's a low level function, which will be called by _Quit() or _NonSecure()
	//print("BallToPlayer " + playerID);
	ball.SendMessage("IMoveTo", BallPositionToPlayer(playerID));
	yield WaitForSeconds(2.0); //XXX
	players[playerID].SendMessage("CatchBall"); //el jugador coge la pelota automaticamente. XXX: be sure!! XXX 2: maybe put this line outside
}



function OnBallCatched(playerID: int) { //se activa cuando alguien cogio pelota
	//print("OnBallCatched: player " + playerID);
	if (playerID == NOPLAYER)
		return;
		
	ownerID = playerID; //now he's the current owner of the ball
	print("Onballcatched player = " + playerID + " and personThrow was = " + personThrow);
	yield UpdateTurn(playerID);	
	
	//************** 1) check if we can burn a player *************************************************
	//rule: if someone throw ball and an opponent catch the ball, burn the thrower. also we have to check if no current burning
	if (CheckBurnThrowPlayer(playerID, personThrow)) //((personThrow != NOPLAYER) && (PlayerTeam(personThrow) != PlayerTeam(playerID)) && (burningID == NOPLAYER))
		BurnPassPlayer(personThrow); //TODO: or BurnNoPass //if burn ok, the code below will be ejecuted before finish burning because burning is slow
		
	//TODO: si toca el suelo antes de ser atrapada, entonces no burn. ademas, el checkBurn debe ser diferente: personThrow si es el mismo que el que brilar
	//************** 2) update actions of IAPlayers and if fifa option is activated, change control to a gamer **************
	
	//****** !fifa : gamers are always the same players ********************************* 
	if (!fifa) { //if has not set the FIFA behavour the players controlled are always the same	
		if ((turnChanged) || (burningID != NOPLAYER))
			UpdateAllIActions();
		else
			UpdateIActions(personThrow, playerID);
			
		turnChanged = false;
		ClearFlags();
		return;
	}
	
	
	//***** fifa : the player who has caught the ball will be a gamer *************************************
	// Person who caught the ball: change the control of gamer
	if (OneGamer()) { //only ONE gamer and if the playerID is a different player to set to the gamer
	
		if (PlayerTeam(playerID) == 1) 
			UpdateGamer(playerID, 1);
		//UpdateIActions: else if (PlayerTeam(playerID) == 2) players[playerID].SendMessage("SetAttack");
	}
	else 
	if (GamerVersusGamer()) { //1 VS 1
		if (PlayerTeam(playerID) == 1)
			UpdateGamer(playerID, 1);	
		else //team 2
			UpdateGamer(playerID, 2);
		
	}
	else { //TWO gamers in team 1: nControlled1 == 2, nControlled2 == 0
		if (PlayerTeam(playerID) == 1) {
		
			if (playerID == gplayerID1)  //if ball return to a pass gamer, no need to change gamer, only update last gamer
				lastGamer = 1;
			else if (playerID == gplayerID2)
				lastGamer = 2;
			else {
			
				var gamer : int; // alternate between gamers: decide who
				if (personThrow == NOPLAYER)
					gamer = OtherGamer(lastGamer); //return ball to the player that isn't the last with the ball
				else
				if (personThrow == gplayerID1) //gamer 1 pass ball to gamer 2
					gamer = 2;
				else
				if (personThrow == gplayerID2) //gamer 2 pass ball to gamer 1
					gamer = 1;
				else //a gamer catch ball from an opponent or from out of the ground: decide who
				if (lastGamer == 1)
					gamer = 2;
				else
					gamer = 1;
					
				UpdateGamer(playerID, gamer); //lastGamer is updated inside
			}
		} //else players[playerID].SendMessage("SetAttack"); //team 2. this in: UpdateIActions():
	}
		
	if ((turnChanged) || (burningID != NOPLAYER)) //there's a change of action of IAPlayers, so update all
 		UpdateAllIActions();
	else
		UpdateIActions(personThrow, playerID); //after update control of playerID, update the control of the rest of players
	turnChanged = false;
	ClearFlags();
	yield;		
}


function OnBallThrown(playerID: int) { //when a player throws the ball
	if (playerID == NOPLAYER)
		return;
		
	print("Player " + playerID + " has thrown the ball"); 
	personThrow = playerID;
	ownerID = NOPLAYER;

	yield; //in a hit all will be happen fast, so wait for next frame
}



/* Cuando un jugador ha sido tocado, marca la situacion.
  Entonces, despues pueden suceder varias cosas:
  - Si la pelota toca el suelo se llamara a OnBallGrounded para brilar a jugador.
  - Si un jugador toca la pelota, personTouched = id. 
  Send from PlayerBallController.OnCollisionEnter() */
function OnPersonTouched(playerID: int) { 
	if (playerID == NOPLAYER)
		return;
		
	print("Player " + playerID + " was touched");
	personTouched = playerID; //id de jugador
	yield;
}


/*When the ball touches the ground: check if one player was touched (for try burn him) 
  or: when the ball is outside the ground (touch the invisible wall outside the ground): check if the ball is out from the ground */
function OnBallGrounded()  {
	if (burningID != NOPLAYER) //there's a player burning
		return;
	
	ballGrounded = true; //print("on ball grounded");
	if (CheckBurnHitPlayer(personTouched, personThrow)) {
		yield BurnPassPlayer(personTouched); //be sure to burn player before return the ball, so yield
	}
	else
	// if the ball is out from the ground: this only can ocurr when the ball go beyond the invisible planes
	//XXX: if (!stopGame)
	if (ball.GetComponent(BallControl).isOut1())
		yield BallToArea1();
	else if (ball.GetComponent(BallControl).isOut2())
		yield BallToArea2();
	//else: XXX: the ball will be free, waiting for be catched by any player: "The law of the West"
}
 

function OnBallOut1() { //when ball touch the invisible plane with tag Plane1 (out area of team 1)
	if (burningID != NOPLAYER) //there's a player burning
		return;
	
	ballGrounded = true; //print("on ball out1");	
	if (CheckBurnHitPlayer(personTouched, personThrow)) { //if someone was beated by the ball and then the ball touches the ground: burn player
		yield BurnPassPlayer(personTouched); //be sure to burn player before return the ball, so yield. TODO: quit yield xDDDD
		//print("Finished Burn Player");
	}
	else
		yield BallToArea1();
}

function OnBallOut2() { //when ball touch the invisible plane with tag Plane2 (out area of team 2)
	if (burningID != NOPLAYER) //there's a player burning
		return;
		
	ballGrounded = true; //print("on ball out2");
	if (CheckBurnHitPlayer(personTouched, personThrow)) //(personTouched != NOPLAYER)
		yield BurnPassPlayer(personTouched); //burn player will be pass the ball to him
	else
		yield BallToArea2();
}



function BallToArea1() { //return the ball to a player of the Area 1: GAME1 or BURNED2
	//TODO: if (!fifa): return to last gamer if possible (see the area)
	
	var playerID = 0; //by default return to first player of team 1: if there's no players burned of team 2 and player 0 is not burned 
	var i : int;
	
	if (nBurned2) { //search a burned player of team 2 (he's in the BURNED2 area: Area 1)
		for (i = nPlayersTeam; i < nPlayersTeam*2; i++) 
			if (burned[i]) {
				playerID = i;
				break; //found first burned player of team 2
			}
	}
	else if (nBurned1) { //search for first player of team 1 not burned
		for (i = 0; i < nPlayersTeam; i++) 
			if (!burned[i]) {
				playerID = i;
				break; //found first surviving player of team 1
			}	
	}
	
	print("Ball to Area 1, so return to " + playerID);	
	s_PrisonHUD.OnBallOut(1, playerNames[playerID]);
	yield WaitForSeconds(timeGrounded);
	yield BallToPlayer_Quit(playerID);
}

function BallToArea2() { //return the ball to a player of the Area 2: GAME2 or BURNED1
	//TODO: if !fifa: better to the gamer
	var playerID = nPlayersTeam; //by default return to first player of team 2: if there's no players burned of team 1 and player 'nPlayersteam' is not burned 
	var i : int;
	
	if (nBurned1) { //search a burned player of team 1 (he's in the BURNED1 area: Area 2)
		for (i = 0; i < nPlayersTeam; i++) 
			if (burned[i]) {
				playerID = i;
				break; //found first burned player of team 1
			}		
	}
	else if (nBurned2) { //search for first player of team 2 not burned
		for (i = nPlayersTeam; i < nPlayersTeam*2; i++) 
			if (!burned[i]) {
				playerID = i;
				break; //found first surviving player of team 2
			}	
	}
	
	print("Ball to Area 2, so return to " + playerID);	
	s_PrisonHUD.OnBallOut(2, playerNames[playerID]);
	yield WaitForSeconds(timeGrounded);
	yield BallToPlayer_Quit(playerID);
}


/* Burn the player who was touched with the grounded ball. 
   Then pass ball to burned player. all of this with the cameras in full screen to see the video
   This function is called after check (personTouched != NOPLAYER) when ball is grounded */
/*function BurnHitPlayer(playerID: int) { 
	if (CheckBurnPlayer(playerID)) { //check if the playerID is correct
		//print("check pass burning ok");
		SpecialViewToPlayer(playerID);
		yield BurnPlayer(playerID);
		yield BallToPlayer_Quit(playerID);
		RestoreCameras();
	}
}


 Burn the player who has thrown the ball after being caught by an opponent. 
   Then pass ball to burned player. all of this with the cameras in full screen to see the video
   This function is called after check (personTouched != NOPLAYER) when someone caught the ball
function BurnThrowPlayer(playerID: int) { 
	if (CheckBurnPlayer(playerID)) { //check if the playerID is correct
		SpecialViewToPlayer(playerID);
		yield BurnPlayer(playerID); 
		yield BallToPlayer_Quit(playerID);
		RestoreCameras();
	}
}*/
	
	
//rule: if someone throws the ball and an opponent is hit: burn the the beaten player. 
//note: no need to check ballGrounded because this function is called from OnBallGrounded or OnBallOut
function CheckBurnHitPlayer(playerHit: int, playerThrow: int) : boolean { //check if we can burn the hit player	
	//print("personThrow = " + personThrow + ", playerID = " + playerID);
	if ((playerThrow == NOPLAYER) || (playerHit == NOPLAYER)) //if nobody was beaten or nobody has thrown the ball, no rule to burn
		return false;
	
	if ((burned[playerHit]) || (burningID != NOPLAYER)) //if player was burned before or someone is currently burning: no burn
		return false; //note that player.hasProtection and player.hasBall is checked in script BallPlayer.OnCollisionEnter()
		
	print("Player " + playerThrow + " hits to player " + playerHit);
	if (PlayerTeam(playerHit) == PlayerTeam(playerThrow)) { //if a person hits to a member of its own team (included himself): no burn 
		print("Hit to a member of its own team: no burn");
		return false;
	}
	
	return true;
}

//rule: if someone throws the ball and and an opponent catches the ball without grounding: burn the thrower player
function CheckBurnThrowPlayer(playerCatch: int, playerThrow: int) : boolean { //check if we can burn the player who thrown the ball
	if ((personThrow == NOPLAYER) || (playerCatch == NOPLAYER))
		return false;
		
	if ((burned[playerThrow]) || (burningID != NOPLAYER) || (ballGrounded)) //we also check the ball: if it touches the ground, no burn
		return false;
		
	print("Player " + playerThrow + " throw ball but player " + playerCatch + " catches the ball before grounded");
	if (PlayerTeam(playerThrow) == PlayerTeam(playerCatch)) { //if both are on the seam team: nothing, it's only a ball pass
		print("But really, player pass ball to a member of its own team: no burn");
		return false;
	}
	
	return true;
}


function BurnPassPlayer(playerID: int) {
	print("burnpassplayerrrr");
	SpecialViewToPlayer(playerID);
	yield BurnPlayer(playerID);
	print("burnpassplayer: fin burn playerrr");
	yield BallToPlayer_Quit(playerID);
	RestoreCameras();
}

function BurnPlayer(playerID: int) { //burn the player. it's called in OnBallGrounded with yield for stop. note: call this after CheckBurnPlayer()
	print("Burning Player ID = " + playerID);
	
	ball.SendMessage("SetCaught", true); //we need to set the as caught (even in the ground). reason: other IAPlayer could catch it
	/*if (!HasIA(playerID)) { //need to be IA for move automatically. note that gPlayerID variable continues because gamer will be regain control
		//players[playerID].SendMessage("SetIAPlayer");  //yield players[playerID].GetComponent(PlayerBallController).SetIAPlayer();
		players[playerID].SendMessage("StopControl"); //XXX: maybe stop everybody, and after ReactivateControl()
		yield WaitForSeconds(2); //XXX: be sure
	}*/
		
	burned[playerID] = true;
	burningID = playerID; //this action must be after the check HasIA()
	yield StopIAPlayers(); //temporally IAPlayers idle. UpdateAllIActions() will be called in OnBallCatched to reactivate the actions of them
	
	//See how to move player to the area of burned
	var pos : Vector3; //new position of the player
	if (PlayerTeam(playerID) == 1) {
		nBurned1++; //increase the number of players burned. //print("nBurned1 = " + nBurned1);
		pos = s_groundC.GetPosition(s_groundC.BURNED1, nBurned1, nBurned1 - 1);
	}
	else { //team == 2
		nBurned2++; //print("nBurned2 = " + nBurned2);
		pos = s_groundC.GetPosition(s_groundC.BURNED2, nBurned2, nBurned2 - 1); //team 2
	}
	
	if ((nBurned1 == nPlayersTeam) || (nBurned2 == nPlayersTeam)) {
		if (nBurned1 == nPlayersTeam) {
			print("The team 2 is the winner!");
			s_PrisonHUD.OnEnd(2);
		}
		else {
			print("The team 1 is the winner!");
			s_PrisonHUD.OnEnd(1);
		}
		print("End of Game"); //from PrisonHUD.js will be called Application.LoadLevel("GameOver") after display the HUD message
		if (endSound)
			audio.PlayOneShot(endSound);
		 
	}
	else if (burnSound)
			audio.PlayOneShot(burnSound);

	//SpecialViewToPlayer(playerID);
	s_groundC.IgnoreCollision(players[playerID], true); //let player cross the limits of ground for move to new area //s_groundC.SetStateLimits(false);
	s_PrisonHUD.OnBurned(playerNames[playerID], PlayerTeam(playerID)); //display on HUD the message of burned
	yield WaitForSeconds(timeGrounded);
	
	debugMovingPos = pos; //XXX, temporally for debug: DrawGizmos
	//XXX: variable movingToNewPosition = stopGame para que los demas jugadores esten quietitos
	//yield MoveTo(players[playerID], pos, timeToPosition + 1); //yield WaitForSeconds(timeToPosition + 2); 
	yield players[playerID].GetComponent(PlayerMoveController).MoveTo(pos, runToPosition, timeToPosition + 1); //XXX
	
	s_groundC.IgnoreCollision(players[playerID], false); // once player move to new position, prohibit him not cross limits again //s_groundC.SetStateLimits(true);
	
	yield ReorganizePlayers(); //players[playerID].SendMessage("IMoveToDefault");
	yield WaitForSeconds(1);
	
	/*if (!HasIA(playerID)) { //XXX:
		players[playerID].SendMessage("ReactivateControl"); //if player was controlled by a gamer, recover its control
		WaitForSeconds(2); //XXX: be sure
	}*/
	
	/*if (playerID == gplayerID1) //if player was controlled by a gamer, recover its control
		yield SetGamer(playerID, 1);
	else if (playerID == gplayerID2)
		yield SetGamer(playerID, 2);
	yield WaitForSeconds(2);*/
	
	//yield BallToPlayer_Quit(playerID); RestoreCameras(); yield; //if he's IA yet, depending of the situation will be called or not SetGamer() in OnBallCatched()
	print("end burning " + playerID); //XXX: be sure to wait //burningID = NOPLAYER in Clear_Throw_Touch_Burning(), in OnBallCatched()
}

/* Reorganize players inside its respective areas. 
   Note: all the players must be IAPlayers, so the change of control must be before call this functions
   Note: it will be called as a coroutine for wait to enable again the players */
function ReorganizePlayers() { 
	var contBurned = 0;
	var contAlive = 0;
	var pos : Vector3;
	var rot : Quaternion;
	
	//print("start Reorganize players");
	
	for (var i=0; i < nPlayersTeam; i++) { //team 1
		if (burned[i]) {
			pos = s_groundC.GetPosition(s_groundC.BURNED1, nBurned1, contBurned);
			rot = Quaternion.Euler(0, 180, 0);
			contBurned++;
		}	
		else {
			pos = s_groundC.GetPosition(s_groundC.GAME1, nPlayersTeam - nBurned1, contAlive);
			rot = Quaternion.identity;
			contAlive++;
		}
				
		players[i].SendMessage("SetDefaultPosition", pos);
		players[i].SendMessage("SetDefaultRotation", rot);
		yield; yield;
		players[i].SendMessage("IMoveToDefault"); //immediate move to the default position and rotation*/
		//players[i].GetComponent(PlayerMoveController).SetIMove
		
	} //for
	
	
	contBurned = 0;
	contAlive = 0;
	for (i=nPlayersTeam; i < nPlayersTeam*2; i++) { //team 2
		if (burned[i]) {
			pos = s_groundC.GetPosition(s_groundC.BURNED2, nBurned2, contBurned);
			rot = Quaternion.identity;
			contBurned++;
		}	
		else {
			pos = s_groundC.GetPosition(s_groundC.GAME2, nPlayersTeam - nBurned2, contAlive);
			rot = Quaternion.Euler(0, 180, 0);
			contAlive++;
		}
				
		players[i].SendMessage("SetDefaultPosition", pos);
		players[i].SendMessage("SetDefaultRotation", rot);
		yield; yield;
		players[i].SendMessage("IMoveToDefault");
		
	} //for
	
	yield; //wait for next frame 
	//print("Finished reorganize players (inside function)");
}


function OnChangePlayer(playerID: int) { //when a gamer playerID without ball wants to change the control to other player of its team: to the newID
	//select the nearest player in the same area
	print("OnChangePlayer " + playerID);
	if (!fifa) // (nControlled1 == nPlayersTeam) if checked at the beginning to set fifa variable
		return;
		
	var newID = NOPLAYER; //player to pass
	var gamer : int;
	var other_gplayerID : int;
	
	if (playerID == gplayerID1) {
		gamer = 1;
		other_gplayerID = gplayerID2;
	}
	else if (playerID == gplayerID2) {
		gamer = 2;
		other_gplayerID = gplayerID1;
	}
	else
		return; //playerID must be controlled by a gamer, in other case exit

	newID = NearestPlayer(playerID, other_gplayerID, PlayerTeam(playerID));
	
	if (newID != NOPLAYER)
		UpdateGamer(newID, gamer);
}


function OnFarChangePlayer(playerID: int) {
	//if gamer press key_pass very strong, the change will be to the other area
	print("OnFarChangePlayer " + playerID);
	if (!fifa)
		return;
		
	var newID = NOPLAYER;
	var gamer : int;
	var other_gplayerID : int;
	var i : int;
	var oldBurned = burned[playerID]; // is burned this player?
	
	if (playerID == gplayerID1) {
		gamer = 1;
		other_gplayerID = gplayerID2;
	}
	else if (playerID == gplayerID2) {
		gamer = 2;
		other_gplayerID = gplayerID1;
	}
	else
		return; //playerID must be controlled by a gamer, in other case exit
	
			
	if (PlayerTeam(playerID) == 1) {
	
		if (nBurned1) {
			for (i = 0; i < nPlayersTeam; i++) //search the first player in the other area
				if ((oldBurned != burned[i]) && (i != other_gplayerID)) { //the player to pass is in the other area: different state
					newID = i;
					break;
				}
		}	
		else
			newID = NearestPlayer(playerID, other_gplayerID, 1); //if no players burned, only pass to the nearest player of its area
	
	}
	else { //team 2
			
		if (nBurned2) {
			for (i = nPlayersTeam; i < nPlayersTeam*2; i++) //search the first player in the other area
				if ((oldBurned != burned[i]) && (i != other_gplayerID)) { //the player to pass is in the other area: different state
					newID = i;
					break;
				}
		}	
		else
			newID = NearestPlayer(playerID, other_gplayerID, 2);
	}
	
	
	if (newID != NOPLAYER)
		UpdateGamer(newID, gamer);
}

/*function Clean() { //XXX: secure clean variables: delete vectors
	//delete;
	Destroy(burned);
	//delete[] burned;
}*/

//******* low level functions ******************************

function GetRemainPlayers1() { //returns the remain players of each team without burning 
	return nPlayersTeam - nBurned1;
}

function GetRemainPlayers2() {
	return nPlayersTeam - nBurned2;
}

function OneGamer() {
	return ((nControlled1 == 1) && (nControlled2 == 0));
}

function GamerVersusGamer() {
	return ((nControlled1 == 1) && (nControlled2 == 1));
}

function GamersBoth() {
	return (nControlled1 == 2); //no need to check (nControlled2 == 0)
}


function OtherGamer(gamer : int) { //return the other gamer
	if (gamer == 1)
		return 2;
	else
		return 1;
}

/*function OtherGamer(gamer : int) { //return the player ID of the other gamer
	if (gamer == 1)
		return gplayerID2;
	else
		return gplayerID1;
}*/

//set the control to a gamer (1 or 2). key or kinect.
//the use of only one player by gamer, it's guarantied in UpdateGamer()
function SetGamer(playerID: int, gamer: int) { 
	print("SetGamer: playerID = " + playerID + " by gamer " + gamer);
	lastGamer = gamer;
	if (!HasIA(playerID)) //player already controlled by the gamer. it's guaranteed with correct gamer
		return;
			
	if (gamer == 1) {
		gplayerID1 = playerID;
		camera1.SendMessage("SetTarget", players[playerID].transform); 
	}
	else { //gamer == 2
		if (OneGamer()) { //by security, check if are two gamers
			print("SetGamer: error: there isn't a second gamer");
			return;
		}
			
		gplayerID2 = playerID;
		camera2.SendMessage("SetTarget", players[playerID].transform); 
	}
	
	
	if (kinect)
		players[playerID].SendMessage("SetKinectPlayer", gamer);
	else
		players[playerID].SendMessage("SetKeyPlayer", gamer);
	
	yield; //XXX: outside be sure to end the SendMessage
}


//update player to be the new gamer. the pass gamer-player will be IAPlayer
//note that in OnBallCatched() is guarantied that two gamers are not in conflict
function UpdateGamer(playerID: int, gamer: int) { 
	var passGPlayerID : int; //the pass player who has controlled by the gamer
	if (gamer == 1)
		passGPlayerID = gplayerID1;
	else
		passGPlayerID = gplayerID2;
	
	//print("gamer = " + gamer + " id1 = "  + gplayerID1 + " id2 = " + gplayerID2);
	if (passGPlayerID != playerID) { //different player. note: first IA, after that set gamer
		players[passGPlayerID].SendMessage("SetIAPlayer"); //pass gPlayer1 set as IA. 
		yield;
		players[passGPlayerID].SendMessage("SetHelp"); //help to the new gamer
 		SetGamer(playerID, gamer); //update the new gPlayerID
		yield;
	}
}


function StopIAPlayers() {
	for (var i = 0; i < nPlayersTeam*2; i++) //temporally set every IAPlayer idle
		if (HasIA(i))
			players[i].SendMessage("SetHelp"); //TODO: maybe SetIdle
	yield; //for call yield in BurnPlayer(), for wait until this function finishes
}

/*function StopEverybody() {
	StopIAPlayers();
	players[gplayerID1].SendMessage("StopControl");
	players[gplayerID2].SendMessage("StopControl");
}*/


function UpdateTurn(ownerID: int) { //update current turn of game. if turn is changed send message
	print("UpdateTurn. owner = " + ownerID + ", team = " + PlayerTeam(ownerID));
	if (PlayerTeam(ownerID) == 1) {
		if (turn == 2) {
			turn = 1; 
			s_PrisonHUD.OnTurnChanged(1);
			turnChanged = true;
		}
	}
	else //team 2
		if (turn == 1) {
			turn = 2; 
			s_PrisonHUD.OnTurnChanged(2);
			turnChanged = true;	
		}
	yield;
}


function UpdateAllIActions() { //update the action of all IAPlayers (attack, defend, help). note: be sure to update the turn before
	var i : int;
	
	if (HasIA(ownerID)) //note: don't care to check (PlayerTeam(ownerID) == 2)
		players[ownerID].SendMessage("SetAttack");
		
	if (turn == 1) {
		for (i = 0; i < nPlayersTeam; i++) //team 1 as help (and the owner as attack)
			if ((i != ownerID) && (i != gplayerID1) && (i != gplayerID2))
				players[i].SendMessage("SetHelp");
	
		for (i = nPlayersTeam; i < nPlayersTeam*2; i++) //team 2 as defense position
			if (i != gplayerID2)
				players[i].SendMessage("SetDefend");
	}
	else { //turn == 2
		for (i = 0; i < nPlayersTeam; i++) //team 1 to defend
			if ((i != gplayerID1) && (i != gplayerID2))
				players[i].SendMessage("SetDefend");
	
		for (i = nPlayersTeam; i < nPlayersTeam*2; i++) //team 2 to help the owner
			if ((i != ownerID) && (i != gplayerID2))
				players[i].SendMessage("SetHelp");
	}
	
	yield;
}


/* Only update the actions of two players. Useful to not always use the loops of UpdateAllActions()
In OnBallCatched() change action between player who has thrown ball and player who has taken the ball.
The kind of control of playerCatch must be updated before!! if playerCatch was the gamer, there will no be update to attack
*/
function UpdateIActions(playerThrow: int, playerCatch: int) { //playerCatch == ownerID but is more legible to use it as parameter
	if (playerCatch == NOPLAYER) //playerThrow can be -1, but NO playerCatch
		return;
		
	//1) personThrow: quit attack state to the player who has thrown it
	if ((playerThrow != NOPLAYER) && (playerThrow != playerCatch)) {
		if (HasIA(playerThrow))
			if ((PlayerTeam(playerCatch)) != PlayerTeam(playerThrow))
				players[playerThrow].SendMessage("SetDefend");
			else
				players[playerThrow].SendMessage("SetHelp"); //he throws to a player of its own team
	}
	
	//2) playerID: Person who caught the ball
	if (HasIA(playerCatch)) //nControlled2 == 0 && PlayerTeam(playerCatch) == 2. Note: the control MUST be updated before!!
		players[playerCatch].SendMessage("SetAttack"); //IAPlayer to set action of attack

	yield;
}

//posible functions GamerOff(gamer), GamersOff(), GamersOn()


/* Set Full Screen to follow a player (change target of camera1 and desactivates camera2.
   This is only temporal for see a special video scene of him.
   This is useful for situations that we need to see a special action of a player, independent if he's a gamer or a IAPlayer.
   Examples of special scenes to view: 
   - Burned or revived player moving to his new area
   - Player who makes a combo attack
   
   Note that is OBLIGATORY to call RestoreCameras() after*/
function SpecialViewToPlayer(playerID : int) {
	camera1.SendMessage("SetTarget", players[playerID].transform);
	
	if (!OneGamer()) {
		camera1.camera.rect = Rect(0, 0, 1, 1); //full screen
		camera2.camera.rect = Rect(0, 0, 0, 0); //no need to desactive the object
	}
}

/* After see a special video of a player with the function SpecialViewToPlayer, we need to restore the states of cameras.
   The cameras changed before will be follow the correct players again: the players who are controlled by gamers */
function RestoreCameras() {
	camera1.SendMessage("SetTarget", players[gplayerID1].transform);
	camera1.SendMessage("Center");	
		
	if (!OneGamer()) {
		camera2.SendMessage("SetTarget", players[gplayerID2].transform);
		camera1.camera.rect = Rect(0, 0, 0.5, 1); 
		camera2.camera.rect = Rect(0.5, 0, 0.5, 1);
		camera2.SendMessage("Center");
	}
}

function ClearFlags() { //clear variables relationated to burning player. called after finish catch the ball
	personTouched = NOPLAYER; //nobody touched, so nobody to burn
	personThrow = NOPLAYER; //clear who throws the ball after someone catch it, no before!!
	burningID = NOPLAYER; //no current burning
	ballGrounded = false; //forget that the ball was grounded
}


function NearestPlayer(playerID : int, dismissID : int, team : int) { //search for the nearest player of specified team to playerID, discarding other (if not discard: NOPLAYER)
	var nearestID = NOPLAYER;
	var minDistance = 100000.0;
	var distance : float;
	var i : int;
	var min : int;
	var max : int;
	
	if (team == 1) {
		min = 0;
		max = nPlayersTeam;
	}
	else { //team == 2
		min = nPlayersTeam;
		max = nPlayersTeam * 2;
	}
		
	for (i = min; i < max; i++) //search player with minimun distance
			if ((i != playerID) && (i != dismissID)) { 
				distance = Vector3.Distance(players[playerID].transform.position, players[i].transform.position);
				if (distance < minDistance) {
					minDistance = distance;
					nearestID = i;
				}
			}

	print("NearestID = " + nearestID);
	return nearestID;
}

//maybe TODO:
//function NearestPlayer: devolver gameobject
//function NearestPlayer: parametro area
//function NearestPlayer: elegir que area, quiza en IAPlayerController

//****** generic functions to use in any other script **********************

//TODO: call MoveTo from PlayerMoveController.js
/*function MoveTo(obj: GameObject, pos: Vector3, maxTime: float) { //move obj to the position pos, with a maximum time
	obj.animation.CrossFade("walk"); //TODO: put in PlayerAnimation.js. learn more about animations
	var time : float = 0.0; //MoveTo
	var angle : float; //XXX: creo que no hace falta porque pos es fija
	var direction : Vector3;
	var move : float;
	
	//obj.GetComponent(PlayerMoveController).RotateTo(pos, 3.0, maxTime); 
	obj.SendMessage("IRotateTo", pos);
	//obj.transform.LookAt(pos); //rotate to see te new position
	yield WaitForSeconds(1);
	//print("end rotate");
	
	while (time < maxTime) { 
		time += Time.deltaTime;	
		
		angle = Vector3.Angle(obj.transform.position, pos);
		move = Mathf.Clamp01((90 - angle) / 90);
		direction = obj.transform.TransformDirection(Vector3.forward * move);
		obj.GetComponent(CharacterController).SimpleMove(direction); //XXX: change performance
		
		//XXX: maybe can exceed time to arrive. so use a break if object arrive to position
		yield;
	}
	
	obj.animation.CrossFade("idle");	
	obj.transform.position = pos; //IMove: partial solution to the XXX above
	yield;
	//print("finish moveTo");
}*/


function PlayerTeam(playerID: int) { //returns the team of a player. it's equivalent to: players[playerID].GetComponent("BallPlayer").team but now it's more efficient
	if (playerID < nPlayersTeam)
		return 1;
	else
		return 2;
}


/*function PlayerName(playerID: int) {
	return players[playerID].GetComponent(PlayerBallController).GetName();
}*/

function HasIA(playerID: int) { //returns true if player is a IAPlayer. it's equivalent to: players[playerID].GetComponent("BallPlayer").HasIA(), but now it's more efficient
	//if (burningID != NOPLAYER) //when player is burned he's moving to burn area as a IAPlayer. all players are IAPlayer only at that time
	//	return true;
		
	return (playerID != gplayerID1) && (playerID != gplayerID2);
	//return !VectorControlled[playerID];
}

function BallPositionToPlayer(playerID: int) {
	return players[playerID].transform.position + Vector3.forward + Vector3.up * 10;
	
	//old position: 
	/*var y = ball.transform.position.y; //se coloca la pelota enfrente del jugador
	ball.transform.position = players[playerID].transform.position + Vector3.forward; //players[playerID].transform.forward; //+ players[playerID].transform.up * 30; // * 20;//forward;
	ball.transform.position.y = y; */
}



function OnDrawGizmos() { //in scene view for debugging: when a player is moving to a new area, draw the new position
	if (burningID != NOPLAYER) { //TODO: || reviving
		Gizmos.color = Color.red;
		Gizmos.DrawWireSphere(debugMovingPos, 1.0); 
	}
}