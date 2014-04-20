#pragma strict
//a bit inspirated in EnemyPoliceGuy.js of 3DPlatform(see more in PlayerMoveController.js). also a bit inspirated in ThirdPersonController.js

//this script must be disabled at the beginning

/*

Script for control an IAPlayer, player controlled by the system, no by the gamer. He could be an opponent or a partner of a gamer.

He has a target object: it depends on attack or defend.
The IAPlayer has 4 states:
- DEFEND: target=ball. He could have different behaviours, depending of the situation, difficult level, etc.
 He can try steal the ball (with the risk of let it off and then be burned), or simply try to scape from the ball.
 
- ATTACK: target = a player of the opposite team. The player will try to burn the target player.
 It's necessary to control the change of target, for example: the nearest opponent.
 Aim and then throw the ball. The velocity of aim and the strength of thrown depends of the difficult level.
 Bear in mind that the features will be different if the player is the opponent of the gamer or not (only one team with gamer/s): 
 if he's an opponent the features will be improved with the difficult level, 
 while if he's a partner of the gamer, the feautures will aggravate with the level.

 As a less useful behaviour, the player could pass the ball to a partner. Useful to deceive opponents and burn someone of then easier.
 
- HELP: target=ball or maybe other target. A partner is attacking, so this player must have a colaborative behaviour. 
  The most simple behaviour is being idle, like state IDLE.
  
- IDLE (none): no target, no actions. Useful for example to move to other position. TODO
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
static var IDLE = -1; //no actions

private var action = HELP; //current action. by default is help

private var s_PlayerBall: PlayerBallController; //scripts of player
private var s_PlayerMove: PlayerMoveController; 
private var s_ballControl : BallControl; //script of ball. XXX: maybe only use SendMessage

private var s_PrisonRules : PrisonRules; //script of game rules

private var addedPower = 0.4; //300 //TODO: variable
//private var vError : int; //the error for aim. TODO
//private var hError : int;

private var timeToMovePosition = 4.0;
private var changingAction = false;

var thinkTime = 3.0; //time to think: before throw,etc. TODO: maybe set different times by actions
var actionTime = 6.0;
var actionDistance = 7.0; //TODO: maybe set different distance by actions

private var toDisable = false; //break the main loop when disable this script

//private var limitCollision = false; //if has collided with the invisible limits of ground
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
			if (offset.magnitude < actionDistance) { //if the target is close enough, in a certain distance radius 
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
				
			} //if radio
			else
				yield Idle();	
		} //if changing
		
		yield;
	}
}

//TODO:
function Update() {

	//switch()
	
	//s_PlayerMove.UpdateRotateTo(target.position, 3);
	//if (!limitCollision)
		//s_PlayerMove.UpdateMoveTo(target.position, 3);
}

function OnEnable() { //when enable = true, starts the main loop again
	SendMessage("SetForwardTransform", gameObject.transform);
	toDisable = false;
	//MainLoop();
}

function OnDisable() { //when this.enable = false, the main loop will be finished: change player control. wait for receive OneEnable message to start again
	toDisable = true;
}


function ResetAction() {
	CancelInvoke(); 
	StopAllCoroutines();
}

function SetDefend() { //set to defense position. for example, when this player throws the ball
	changingAction = true;
	//ResetAction();
	target = GameObject.FindWithTag("Ball").transform; //interesting use Find to take a bit latency: is normal in a person
	action = DEFEND;
	//yield s_PlayerMove.MoveToDefault(-1); //timeToMovePosition);
	changingAction = false;
}

function SetHelp() { //set to help position: colaborate with his partner who has the ball
	changingAction = true;
	target = GameObject.FindWithTag("Ball").transform; //XXX: maybe other target
	action = HELP;
	changingAction = false;
}

function SetAttack() { //when the player catches the ball (and no controlled by gamer), set to attack position. he'll try to burn an opponent
	changingAction = true;
	action = ATTACK; //the selection of target in attack mode will change every time in the main loop (SelectPlayerToAttack())
	
	//test:
	/*print("Set atttackkkk");	
	target = GameObject.Find("/LerpzPlayer(Clone)1").transform; //SelectPlayerToAttack();

	yield WaitForSeconds(2);
	var direction = target.position - transform.position; //heading vector
	direction = direction / direction.magnitude; //final direction = heading / distance
	print("direction = " + direction);
	yield s_PlayerBall.TryThrowBall(direction, addedPower); //if catch the ball, will wait more, to avoid to catch ball itself.*/
	
	changingAction = false;
}

function SetIdle() { //set as idle, without actions
	changingAction = true;
	action = ATTACK;
	changingAction = false;
}


function SelectPlayerToAttack() { //TODO: maybe in the script of group of IAPlayers
	//target = GameObject.FindWithTag("Player").transform;
	target = GameObject.Find("/LerpzPlayer(Clone)1").transform;
	yield;
	//if (s_PlayerBall.GetTeam()
	//target = s_PrisonRules.NearestPlayer(s_PlayerBall.GetPlayerID(), -1, 2).transform;
}

function RotateToTarget() { //maybe only use for debug
	yield s_PlayerMove.RotateTo(target.position, 10.0); //TODO: timeToMovePosition);
}

function IA_TryStealBall() { //a specific behaviour of defend position: try steal the ball when the opponent throws the ball. useful to burn the thrower.
	
	/*if (s_PlayerBall.HasBall()) { //TODO: maybe don't require to check because he's attacking!!
		yield WaitForSeconds(actionTime); //nothing, only wait
		return;
	}*/
	
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


function IA_TryEscape() { //a specific behaviour of defend position: try scape from the ball. useful to avoid being burned by the thrower opponent.
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


function IA_TryBurn() { //the most usual behaviour of attack position: try burn an opponent.
	/*if (!s_PlayerBall.HasBall()) { //TODO: maybe don't require to check because he's attacking!!
		yield WaitForSeconds(actionTime); //nothing, only wait
		return;
	}*/ 
	var direction : Vector3;
	
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
		
		//TODO: if target enough near
		direction = (target.position - gameObject.transform.position).normalized;
		yield s_PlayerBall.TryThrowBall(direction, addedPower); //if catch the ball, will wait more, to avoid to catch ball itself.
		//TODO: change power. 
		
		time += (System.DateTime.Now.Second - startTime);
	}
	
	yield;
}


//TODO: function IA_PassBall() //a less usual behaviour of attack position: pass ball to a partner. useful to deceive opponents and burn someone of then easier

function IA_Help() { //in help position: a colaborative behaviour. TODO: by now it's only idle.
	yield; // WaitForSeconds(actionTime); //TODO time. ResetAction will stop this function when change kind of action
	//yield s_PlayerMove.WaitIdle(actionTime);
}

function Idle() { //no actions
	yield;
	//yield s_PlayerMove.WaitIdle(actionTime);
}


function OnDrawGizmosSelected () {
	Gizmos.color = Color.yellow;
	Gizmos.DrawWireSphere(transform.position, actionDistance); //TODO: DrawLine
 }


/*function OnCollisionEnter(col : Collision) {
	print("OnCollisionEnter IAPlayer");
	if ((col.collider.CompareTag("Limit")) ) {
		print("IAPlayer collide with limit of ground");
		limitCollision = true;
		yield WaitForSeconds(2);
		limitCollision = false;
	}
}*/
		

@script RequireComponent(PlayerBallController)
@script RequireComponent(PlayerMoveController)
