#pragma strict 

/*inspirado en ThirdPersonCharacterAttack.js

Generic functions of the two kinds of players: Player and IAPlayer

pasos: no tiene pelota, coge pelota, apunta, tira pelota

*/

static var IA_PLAYER = 1;
static var KEY_PLAYER = 2;
static var KINECT_PLAYER = 3;

/*XXX: private*/ var playerID: int; //identificador de jugador en la cancha
var namePlayer = "player"; //name of the player //var playerID in PrisonRules.js
var team = 1; //team of player: 1 or 2
var gamer = 0; //gamer who controls him. 1 or 2. 0: no gamer

var punchSpeed = 1;
var punchHitTime = 0.2;
var punchTime = 0.4;
var punchPosition = new Vector3 (0, 0, 0.8);
var punchRadius = 1.3;
var punchHitPoints = 1;

var throwSound : AudioClip;

private var busy = false; 

//mias

//throw ball with power between [150, 800] with a direction.y = 1. good values: power=350, y=1. don't need to change y
var maxPower = 800; 
var minPower = 150;
var strongPower = 400; //threshold of power indicating that power is enough to another special situation: pass ball to player in other area, throw ball losing direction, bonus hit...

//var powerLoseDirection = 1100; //if player throw very strong, he will lose direction from this value. if this value is high, the player will be better
var basePower = 90; //this will be added with the power of input. this base determinates the strength of the player
var baseDirection = Vector3(0, 1, 0); //y = para tirar un poco arriba: tiro parabolico. x, z: direccion

var raiseBall = 2;
var aimVMax = 0.5; //limites de apuntar con pelota
var aimHMax = 0.5;
var aimStep = 0.01; //step para apuntar con pelota

private var aimV = 0.0; //current offset of ball for aim
private var aimH = 0.0;

private var ball : GameObject;
private var hasBall = false; //tiene pelota
//private var touched = false; //tocado por pelota
private var hasProtection = false; //protection against burning. false: can be burned. true: can't be burned


private var defPos: Vector3; //default position of player
private var defRot: Quaternion; //default rotation of player

private var collisionFlags : CollisionFlags; // The last collision flags returned from controller.Move

private var control : int; //mode of control: artificial intelligence, keyboard or kinect. by default will be IA_PLAYER. need to start as 0 for call SetIAPlayer()

private var s_PrisonRules : PrisonRules;

function Start () {
	ball = GameObject.FindGameObjectWithTag("Ball");
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
	
	animation["punch"].speed = punchSpeed;	
	
	// like SetIAPlayer() but manually set components. By default is a player controlled by the system (with IA behavours)
	busy = true;
	DisableScript(PlayerController);
	DisableScript(PlayerAnimation);
	DisableScript(ZigSkeleton);
	EnableScript(IAPlayerController);
	control = IA_PLAYER;
	busy = false;
	yield;
}


function SetName(name2: String) {
	namePlayer = name2;
}

function GetName() {
	return namePlayer;
}

function SetTeam(team2: int) {
	team = team2;
} 

function HasBall() { //devuelve si tiene pelota
	return hasBall;
}

/*function HasProtection() {
	return hasProtection;
}*/

function IsBusy() {
	return busy;
}


/* function GetTouched() { //devuelve si ha estado tocado por pelota
	return touched;
}


function SetTouched(state: System.Boolean) {
	touched = state;
} */

function SetDefaultPosition(pos: Vector3) {
	defPos = pos;
}


function GetDefaultPosition() {
	return defPos;
}

function SetDefaultRotation(rot: Quaternion) {
	defRot = rot;
}

/*function SetDefaultSituation(pos: Vector3, rot: Quaternion) {
	defPos = pos;
	defRot = rot;
}*/

function GetDefaultRotation() {
	return defRot;
}

function GetPlayerID() {
	return playerID;
}

function SetPlayerID(id: int) {
	playerID = id;
}


function MoveTo(pos: Vector3, maxTime: float) { //player move to a non variable position in a maximum time
	animation.CrossFade("walk"); //NOTE: learn more about animations
	var time : float = 0.0; //MoveTo
	var angle : float; //XXX: creo que no hace falta porque pos es fija
	var direction : Vector3;
	var move : float;
	
	gameObject.transform.LookAt(pos); //rotate to see te new position
	
	while (time < maxTime) { 
		time += Time.deltaTime;	
		
		angle = Vector3.Angle(transform.position, pos);
		move = Mathf.Clamp01((90 - angle) / 90);
		direction = transform.TransformDirection(Vector3.forward * move);
		gameObject.GetComponent(CharacterController).SimpleMove(direction); //XXX: change performance
		
		//XXX: maybe can exceed time to arrive. so use a break if object arrive to position
		yield;
	}
	
	IMoveTo(pos); //TODO: partial solution to the XXX above
	animation.CrossFade("idle");
}

function MoveToDefault(time : float) { //player move to the default position and rotation, with a duration of time seconds
	MoveTo(defPos, time);
	transform.rotation = defRot;
}

function IMoveTo(pos: Vector3) { //instant move to posicion. if any force, quit it
	transform.position = pos;
}

function IMoveToDefault() { //immediate move to the default position and rotation
	IMoveTo(defPos); //transform.position = defPos;
	transform.rotation = defRot;
}

function Appear() { //set visible again and reactivate collisions
	//gameObject.layer = 11; //"LayerPlayer"; //gameObject.renderer.enabled = true;
	for (var rend : Renderer in gameObject.GetComponentsInChildren(Renderer, true)) //include inactive = true
		rend.enabled = true;
		
	gameObject.transform.Find("BlobShadowProjector").GetComponent(Projector).enabled = true; //enable shadow
	//TODO: disable all components or gameObject.collider.enabled = true; //CharacterController inherits from Collider
}

function Disappear() { //set invisible and without collisions
	for (var rend : Renderer in gameObject.GetComponentsInChildren(Renderer)) 
		rend.enabled = false;
		
	gameObject.transform.Find("BlobShadowProjector").GetComponent(Projector).enabled = false; //quit shadow
	//gameObject.layer = 12; //"LayerIgnoreCamera" //gameObject.renderer.enabled = false;
	//gameObject.collider.enabled = false;
}

function DisableScript(type: System.Type) {
	var comp = gameObject.GetComponent(type) as MonoBehaviour; //is guaranteed that type is always a script
	comp.CancelInvoke(); 
	comp.StopAllCoroutines();
	comp.enabled = false;
}

function EnableScript(type: System.Type) {
	var comp = gameObject.GetComponent(type) as MonoBehaviour;
	comp.enabled = true;
}

function Stop() { //disable all the controls. note that the variable 'control' continues equal for call Reactivate() after
	busy = true;
	DisableScript(IAPlayerController);
	DisableScript(PlayerController);
	DisableScript(PlayerAnimation);
	DisableScript(ZigSkeleton);
	
	if (control == KINECT_PLAYER)
		if (gamer == 1)
			GameObject.FindWithTag("ZigFu").SendMessage("OnUser1Blocked");
		else //gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnUser2Blocked");
			
	busy = false;
}

function Reactivate() { //after a Stop() call, enable again the last control used and if was invisible set visible again
	switch(control) {
		case KEY_PLAYER: SetKeyPlayer(gamer); break; //XXX: maybe only put EnableScript...
		
		case KINECT_PLAYER: 
			SetKinectPlayer(gamer); 
			if (gamer == 1)
				GameObject.FindWithTag("ZigFu").SendMessage("OnUser1Unblocked");
			else //gamer 2
				GameObject.FindWithTag("ZigFu").SendMessage("OnUser2Unblocked");
				
			break;
				
		case IA_PLAYER: SetIAPlayer(); break;
		default: break;
	}
	
	Appear();
}

function SetKeyPlayer(newgamer: int) { //set the control of a gamer with an keyboard and jockstick
	//print("SetKeyPlayer: " + namePlayer); //if (control == KEY_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop(); //XXX
	if (control == IA_PLAYER) //check last kind of control
		DisableScript(IAPlayerController);
	else if (control == KINECT_PLAYER) {
		DisableScript(ZigSkeleton);
		if (gamer == 1) //last gamer to quit kinect control
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer1"); //to KinectEngageUsers //Find("/System/Zigfu").
		else // gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer2");
	}
	
	gamer = newgamer;
	EnableScript(PlayerAnimation);
	EnableScript(PlayerController); //note: the difference between gamer 1 and gamer 2 will be setted in PlayerController.js
	if (gamer == 1)
		SendMessage("SetKeyGamer1"); //to PlayerController
	else
		SendMessage("SetKeyGamer2");
	
	//yield; //WaitForSeconds(2); //necessary to make the change
	gameObject.animation.Play("idle");
	control = KEY_PLAYER; //hasIA = false;
	busy = false;
	yield;
	//print("Fin SetKeyPlayer: " + namePlayer); 
}


function SetKinectPlayer(newgamer: int) { //set the control of a gamer with the Kinect sensor
	//print("SetKinectPlayer: " + namePlayer); //if (control == KINECT_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop();	
	if (control == IA_PLAYER)
		DisableScript(IAPlayerController);
	else if (control == KEY_PLAYER) {
		DisableScript(PlayerController);
		DisableScript(PlayerAnimation);
	}
	
	gamer = newgamer;
	EnableScript(ZigSkeleton);
	if (gamer == 1)
		GameObject.FindWithTag("ZigFu").SendMessage("OnChangePlayer1", gameObject); //to KinectEngageUsers
	else //gamer 2
		GameObject.FindWithTag("ZigFu").SendMessage("OnChangePlayer2", gameObject);
			
	//yield; //necessary to make the change 	
	control = KINECT_PLAYER;
	busy = false;
	yield;	
	//print("Fin SetKinectPlayer: " + namePlayer);
}


function SetIAPlayer() { //set the control of the PC, artificial intelligence
	//print("SetIAPlayer: " + namePlayer); //if (control == IA_PLAYER) return;	
	busy = true;
	gameObject.animation.Stop(); 
	if (control == KEY_PLAYER) {
		DisableScript(PlayerController);
		DisableScript(PlayerAnimation);
	}
	else if (control == KINECT_PLAYER) {
		DisableScript(ZigSkeleton);
		if (gamer == 1)
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer1");
		else //gamer 2
			GameObject.FindWithTag("ZigFu").SendMessage("OnNullPlayer2");
	}
	
	gamer = 0; //no gamer
	EnableScript(IAPlayerController);
	
	//yield; //necessary to make the change 
	gameObject.animation.Play("idle");
	control = IA_PLAYER;
	busy = false;
	yield;
	//print("Fin SetIAPlayer: " + namePlayer);
}


function HasIA() {
	return control == IA_PLAYER; //return hasIA;
}

/*function Update ()
{
	
		
} */

//we have the direction we want, but if the power is so high, we'll lose direction, return the new worse direction
/*function LoseAim(direction: Vector3, power: float) { //it's guarantied that this power is in the allowed range
	if (power < powerLoseDirection)
		return direction; //no lose direction

	var y = (maxPower - power) / 100;
	print("Lose direction + y = " + y);
	return direction + Vector3.up * y;
}*/

function QuitBall() { // to not have the ball, but the ball remains caught without physics. useful to pass to another player
	print("Quit ball to player " + playerID);
	busy = true;
	hasBall = false;
	Physics.IgnoreCollision(gameObject.collider, ball.collider, false); //reactivate the collisions between this player and the ball
	busy = false;
}

function LeaveBall() { //quit the ball and return the physics of ball
	QuitBall();
	ball.SendMessage("SetCaught", false);
}


//NOTE that CatchBall() and Try_CatchBall() NO checks: !ball.isCaught and !player.hasBall. this is checked in PlayerController.js, IAPlayerControllr.js and PrisonRules.js

function CatchBall() { //auto catch ball. be careful outside to check no other player has the ball
	//print("ball catched");
	
	hasBall = true;
	ball.SendMessage("SetCaught", true); //also grounded = false, SetPhysics(false) inside
	Physics.IgnoreCollision(gameObject.collider, ball.collider); //if catched: no collisions between this player and the ball. this lets the player to move freely
		
	//in Update(), AimBall() : ball.transform.position = Vector3(pos.x, raiseBall, pos.z);	

	//in OnBallCatched() of PrisonRules.js: SetController(...)	
	s_PrisonRules.OnBallCatched(playerID); //avisa que alguien cogio pelota, para reiniciar que nadie sea tocado ahi. -> setController. /* XXX yield*/  
}

//si la pelota esta a una cierta distancia del jugador, la coge.
function TryCatchBall()
{
	busy = true;
	//print("PlayerTry_catch ball");
	var pos = transform.TransformPoint(punchPosition);
	if (Vector3.Distance(ball.transform.position, pos) < punchRadius) //si pelota esta cerca de radio de accion
		CatchBall();
	
	busy = false;

}


//si tiene la pelota, antes de tirar puede apuntar moviendo las teclas w, a, s, d
function AimBall(v: float, h: float) { //v and h are the current offsets to be added to aimV and aimH respectively (in a scale of aimStep)
	//print("v="); print(v);
	
	var pos = transform.TransformPoint(punchPosition);	//sigue manteniendo la pelota vaya por donde vaya
	
	if ( ((v < 0) && (aimV > -aimVMax)) || ((v > 0) && (aimV < aimVMax)) )  //si esta dentro del rango
		aimV += v * aimStep;
			
	if ( ((h < 0) && (aimH > -aimHMax)) || ((h > 0) && (aimH < aimHMax)) )  //si esta dentro del rango
		aimH += h * aimStep;
			
	//ball.transform.position = Vector3(pos.x + x , raiseBall + y, pos.z);	
	ball.transform.position = Vector3(pos.x + aimH , raiseBall + aimV, pos.z);
	ball.transform.rotation.y = this.transform.rotation.y; //rota con el personaje. solo sirve para que oponentes roten tambien*/

}


function ThrowBall(power: float, direction : Vector3) {
		//print("va a tirar la pelotaa");
		if (throwSound)
			audio.PlayOneShot(throwSound);
				
		ball.SendMessage("SetCaught", false);
		Physics.IgnoreCollision(gameObject.collider, ball.collider, false); //reactivate the collisions between this player and the ball
		s_PrisonRules.OnBallThrown(playerID); //send event that this player has thrown the ball /*XXX yield*/
	
		ball.GetComponent(BallControl).Throw(power, direction); //XXX: efficiency. ball.SendMessage("Throw", throwPower, throwDirection);
		hasBall = false;
}


//si el jugador tiene la pelota, la tira con fuerza y direccion
function TryThrowBall(inputThrowPower: float) {
	
	busy = true;
	//print("player Try ThrowBall");
	if (control != KINECT_PLAYER)
		animation.CrossFadeQueued("punch", 0.1, QueueMode.PlayNow); //hacemos que pueda hacer movimiento aunque no tenga pelota
	yield WaitForSeconds(punchHitTime);
	//var pos = transform.TransformPoint(punchPosition);
	
	if (hasBall) {
		//in OnBallCatched() of PrisonRules.js: SetController(...)	    	
		// tirar pelota segun orientacion del jugador
		//print("keyThrowPower = " + keyThrowPower);
		var power = Mathf.Clamp(basePower + inputThrowPower, minPower, maxPower); //print("final power = " + power);
		var direction = gameObject.transform.forward + baseDirection + Vector3(aimH, aimV, 0); //orientation of player + base direction + aim
		//test: power = basePower; direction.y = maxY_direction; //direction = LoseAim(direction, power);
		ThrowBall(power, direction);
	}

	yield WaitForSeconds(punchTime - punchHitTime);
	busy = false;
}



function ChangePlayer(keyThrowPower: float) { //Without ball (checked in PlayerController.js), auto switch control to other player
	if (basePower + keyThrowPower >= strongPower)
		s_PrisonRules.OnFarChangePlayer(playerID);
	else 
		s_PrisonRules.OnChangePlayer(playerID); //decide who is the nearest. don't care the power of throw, it will be always the same
}


function TryPassBall(keyThrowPower: float) { //throw ball with the direction to aimed player, but an opponent could catch it before	
	print("TryPassBall " + namePlayer);
	/*TODO or not: if (keyThrowPower > umbral) OnFarPassBall() //to the other area of his partners
		
	s_PrisonRules.OnPassBall(playerID, Vector3(aimH, aimV, 0), keyThrowPower); //decide the target player depending on (aimH, aimV) and the final direction
	//OnPassBall will send here ThrowBall() */
}



function OnDrawGizmosSelected ()
{
	Gizmos.color = Color.yellow;
	Gizmos.DrawWireSphere (transform.TransformPoint(punchPosition), punchRadius);
}


function IsGrounded () {
	return (collisionFlags & CollisionFlags.CollidedBelow) != 0;
}


function OnCollisionEnter (col : Collision) {
	//print("playerball collision enter");
	if ((col.collider.CompareTag("Ball")) ) {
		//SetTouched(true); //TODO mejorar: que si toca las mnanos no sea tocado.
		//GameObject.FindWithTag("PrisonRules").SendMessage("OnPersonTouched", GetPlayerID()); //avisa que fue tocado
		if ((!ball.GetComponent(BallControl).IsGrounded()) && !hasProtection && !hasBall)
			s_PrisonRules.OnPersonTouched(GetPlayerID());
	} 
}


/*function IsGroundedWithTimeout ()
{
	return lastGroundedTime + groundedTimeout > Time.time;
}*/

@script RequireComponent(ZigSkeleton);
@script RequireComponent(IAPlayerController);
@script RequireComponent(PlayerController);
@script RequireComponent(PlayerAnimation);
