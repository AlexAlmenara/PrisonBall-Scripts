#pragma strict
//a bit inspirated in EnemyPoliceGuy.js (see more in PlayerMoveController.js). also a bit inspirated in ThirdPersonController.js

//this script must be disabled at the beginning

/*
Script para controlar a un IAPerson, jugador controlado por la maquina, ya sea oponente o no.
La parte de controlar la pelota (coger, apuntar, tirar) lo hace aparte el script IAPlayerBall.js

Tiene un objetivo: target que dependera de si defiende o ataca.
El IAPlayer tiene dos estados: ATTACK, DEFEND. 
- DEFEND: target=pelota. En defensa puede tener distintos comportamientos, dependiendo de la situacion, nivel de dificultad, etc.
  Puede intentar atrapar la pelota (con riesgo de rebotarle y ser brilado), o escapar de la pelota.
- ATTACK: target=algun jugador. Tiene que controlarse el cambio de jugador segun situacion, por ej, al oponente mas cercano
	Apuntara y tirara la pelota. La velocidad de apuntar y fuerza de tirar dependera del nivel de dificultad.
	Tener en cuenta que si pertenece al equipo oponente: al subir el nivel las caracteristicas mejoraran,
	mientras que si pertenece al equipo del jugador unico, entonces podria disminuir las caracteristicas.
- HELP: 
- NONE: for example for move to other position. TODO
*/

/*
	animations played are:
	idle, threaten, turnjump, attackrun
*/

var target : Transform;

private var characterController : CharacterController; // Cache a reference to the controller

//kind of actions of IA (each of them with different strategies)
static var ATTACK = 1; //attack with ball
static var HELP = 2; //if a partner has the ball: this player will help
static var DEFEND = 0; //an opponent has the ball: defend, trying to not be burned 

private var action = HELP; //current action. by default is help

private var s_PlayerBall: PlayerBallController; //scripts
private var s_PlayerMove: PlayerMoveController; 
private var s_ballControl : BallControl;

private var s_PrisonRules : PrisonRules;

private var addedPower = 300; //TODO: variable
//private var vError : int; //for aim. TODO
//private var hError : int;

private var timeToMovePosition = 4.0;
private var changingAction = false;

var thinkTime = 3.0; //time to think: before throw,etc. TODO: maybe set different times by actions
var actionTime = 7.0;
var actionDistance = 6.0; //TODO: maybe set different distance by actions

private var toDisable = false; //break the main loop when disable this script

//var drawLineToTarget = false; //TODO: if true will create a line to see direction to target


function Start() { //TODO: maybe passive start
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
	
	characterController = GetComponent(CharacterController);
	if (!target)
		target = GameObject.FindGameObjectWithTag("Ball").transform;
			
	s_PlayerMove = gameObject.GetComponent(PlayerMoveController);
	s_PlayerBall = gameObject.GetComponent(PlayerBallController);
	s_ballControl = GameObject.FindGameObjectWithTag("Ball").GetComponent(BallControl);
}


function MainLoop() { //loop that simulates Update() function with a yield in each iteration.
	yield; //important wait to Start
	
	while (true) { //no use Update() because we need to yield functions
	
		if (toDisable) {
			toDisable = false;
			break;
		}
		
		var offset = transform.position - target.position;
	
		if (!changingAction) {
			if (offset.magnitude < actionDistance) { //si el objetivo esta en un radio
				switch (action) {
				case DEFEND:
					//TODO: dependiendo de situacion, de nivel de dificultad, etc, tendra un comportamiento diferente
					yield IA_TryStealBall();
					//yield IA_TryEscape();
					break;
				case HELP:
					yield IA_Help();
					break;
				case ATTACK:
					yield SelectPlayerToAttack(); //first we update the nearest player to try burn
					yield IA_TryBurn();
					break;
				default:
					yield Idle();
				} //switch
				
			} //en rango
			else
				yield Idle();	
		} //changing
		
		//s_PlayerMove.UpdateMove(0, 0, false, false, true); //yield s_PlayerMove.WaitIdle(thinkTime);
		//print("Fin action");
		yield;
	}
}


function OnEnable() {
	SendMessage("SetForwardTransform", gameObject.transform);
	toDisable = false;
	MainLoop();
}

function OnDisable() {
	toDisable = true;
}

/*function Update() {
	s_PlayerMove.UpdateMove(0, 0, false, false); //print("SetDefend finish of player " + GetComponent(BallPlayer).GetPlayerID());
}*/

function ResetAction() {
	CancelInvoke(); 
	StopAllCoroutines();
}

function SetDefend() { //pone en posicion de defensa cuando en IAPlayerBall.js tira pelota
	changingAction = true;
	//ResetAction();
	target = GameObject.FindWithTag("Ball").transform; //interesting use Find to take a bit latency: is normal in a person
	action = DEFEND;
	//yield s_PlayerMove.MoveToDefault(-1); //timeToMovePosition);
	//s_PlayerMove.UpdateMove(0, 0, false, false, true); //print("SetDefend finish of player " + GetComponent(BallPlayer).GetPlayerID());
	changingAction = false;
}

function SetHelp() { //pone en posicion de defensa cuando en IAPlayerBall.js tira pelota
	//print("Set Help");
	changingAction = true;
	//ResetAction();
	target = GameObject.FindWithTag("Ball").transform; //XXX: maybe other target
	action = HELP;
	//yield s_PlayerMove.MoveToDefault(-1); //(timeToMovePosition); //SendMessage("MoveToDefault", timeToMovePosition); //yield WaitForSeconds(timeToMovePosition + 2);;
	//s_PlayerMove.UpdateMove(0, 0, false, false, true);//print("SetHelp finish of player " + GetComponent(BallPlayer).GetPlayerID());
	changingAction = false;
}

function SetAttack() { //pone en posicion de ataque cuando en IAPlayerBall.js coge pelota
	changingAction = true;
	//ResetAction();
	action = ATTACK; //the selection of target in attack mode will change every time in the main loop
	//yield s_PlayerMove.MoveToDefault(-1); //(timeToMovePosition);
	//s_PlayerMove.UpdateMove(0, 0, false, false, true);
	changingAction = false;
}


function SelectPlayerToAttack() {
	target = GameObject.FindWithTag("Player").transform;
	yield;
	//if (s_PlayerBall.GetTeam()
	//target = s_PrisonRules.NearestPlayer(s_PlayerBall.GetPlayerID(), -1, 2).transform;
}

function RotateToTarget() { //maybe only use for debug
	yield s_PlayerMove.RotateTo(target.position, 10.0, timeToMovePosition);
}

function IA_TryStealBall() { // loop 
	/*var angle : float = 180.0;
	var time : float = 0.0;
	var move : float;
	
	animation.CrossFade("walk");
	
	// XXX: cambiar a transform.LookAt(target)
	while (angle > 5 || time < attackTurnTime) { //rotar hacia target. TODO: sustituir por BallPlayer.MoveTo()
		time += Time.deltaTime;
		angle = Mathf.Abs(RotateTowardsPosition(target.position, rotateSpeed));
		move = Mathf.Clamp01((90 - angle) / 90);
		
		// depending on the angle, start moving
		animation["walk"].weight = animation["walk"].speed = move;
		//direction = transform.TransformDirection(Vector3.forward * attackSpeed * move);
		//characterController.SimpleMove(direction);
		
		yield;
	}
	*/
	
	/*if (s_PlayerBall.HasBall()) { //TODO: maybe don't require to check because he's attacking!!
		yield WaitForSeconds(actionTime); //nothing, only wait
		return;
	}*/
	
	
	//TODO: resolver error: cuando se brila a jugador de su mismo equipo. lo coge este en vez del brilado.
	//TODO: the method of move player should be more complex: see the trayectory, distance, power, etc.
	
	//yield s_PlayerMove.RotateTo(target.position, 3.0, timeToMovePosition);
	
	var time = 0.0;
	var startTime = 0.0;
	while (time < actionTime) {
	
		if (s_PlayerBall.HasBall()) {
			yield WaitForSeconds(actionTime - time); //yield s_PlayerMove.WaitIdle(actionTime - time); 
			break;
		}	
		
		startTime = System.DateTime.Now.Second; //+= thinkTime; //Time.deltaTime;
		//yield s_PlayerMove.MoveTo(target.position, false, timeToMovePosition); //TODO: move to position with limited time. this position will be defined by the aimed position!!!
		//yield s_PlayerMove.RotateTo(target.position, 3.0, timeToMovePosition);
		//s_PlayerMove.IRotateTo(target.position);
		yield;
		//yield s_PlayerMove.WaitIdle(thinkTime); //WaitForSeconds(thinkTime); //XXX: note, this is added to catchTime
		//print("Fin un move");
		if (!s_ballControl.IsCaught()) { // ball no caught by anybody
			s_PlayerBall.TryCatchBall();
			yield WaitForSeconds(1.5);
		}
		else
			SendMessage("AlmostTryCatchBall"); //XXX: no yield, so no realistic count of time
			
		time += (System.DateTime.Now.Second - startTime);
	}
			
	yield;
}


function IA_TryEscape() {
	/*var angle : float = 180.0;
	var time : float = 0.0;
	var move : float;
	var direction : Vector3;
	
	animation.CrossFade("walk");
	
	while (angle > 5 || time < attackTurnTime) { //rotar hacia target
		time += Time.deltaTime;
		angle = Mathf.Abs(RotateTowardsPosition(target.position, rotateSpeed));
		move = Mathf.Clamp01((90 - angle) / 90);
		
		// depending on the angle, start moving
		animation["walk"].weight = animation["walk"].speed = move;
		direction = transform.TransformDirection(- Vector3.forward * move);
		characterController.SimpleMove(direction);
		
		yield;
	}*/
	
	//TODO: select back position to Move with limited time
	
	yield;
}


function IA_TryBurn() {
	/*if (!s_PlayerBall.HasBall()) { //TODO: maybe don't require to check because he's attacking!!
		yield WaitForSeconds(actionTime); //nothing, only wait
		return;
	}*/ 
	print("IA_tryBurn");
	
	var time = 0.0;
	var startTime = 0.0;
	while (time < actionTime) {
	
		if (!s_PlayerBall.HasBall()) {
			yield WaitForSeconds(actionTime - time);
			break;
		}
			
		startTime = System.DateTime.Now.Second;
		//TODO: MoveTo with limited time a position near of target: attackDistance or limit of his area
		yield WaitForSeconds(thinkTime / 2.0); //XXX: maybe set a specified time variable to attack
		
		//TODO: gameObject.GetComponent(BallPlayer).AimBall(v, h);
		//yield AimBall(0.5, 0.5); //TODO: apuntar con la pelota
		//TODO: if target enough near
		yield s_PlayerBall.TryThrowBall(Vector3(0.5, 0.5, 0), addedPower); //if catch the ball, will wait more, to avoid to catch ball itself.
		//TODO: change power. 
		
		time += (System.DateTime.Now.Second - startTime);
	}
	
	yield;
}


function IA_Help() {
	//s_PlayerMove.UpdateMove(0, 0, false, false);
	yield; // WaitForSeconds(actionTime); //TODO time. ResetAction will stop this function when change kind of action
	//yield s_PlayerMove.WaitIdle(actionTime);
}

function Idle() {
	//s_PlayerMove.UpdateMove(0, 0, false, false);
	yield;
	//yield s_PlayerMove.WaitIdle(actionTime);
}


function OnDrawGizmosSelected () {
	Gizmos.color = Color.yellow;
	Gizmos.DrawWireSphere(transform.position, actionDistance); //TODO: DrawLine
 }


@script RequireComponent(PlayerBallController)
@script RequireComponent(PlayerMoveController)
