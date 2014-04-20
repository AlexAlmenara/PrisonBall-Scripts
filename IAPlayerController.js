#pragma strict
//inspiarado en EnemyPoliceGuy.js. algo tambien: ThirdPersonCharacterController.js y ThirdPersonAnimation.js

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
*/

/*
	animations played are:
	idle, threaten, turnjump, attackrun
*/

var attackTurnTime = 0.7;
var rotateSpeed = 120.0;
var attackDistance = 17.0;
var extraRunTime = 2.0;

var attackSpeed = 5.0;
var attackRotateSpeed = 20.0;

var idleTime = 1.6;

var punchPosition = new Vector3 (0.4, 0, 0.7);
var punchRadius = 1.1;

private var attackAngle = 10.0;
private var isAttacking = false;
private var lastPunchTime = 0.0;

var target : Transform;

private var characterController : CharacterController; // Cache a reference to the controller

//mias
//kind of actions of IA (each of them with different strategies)
static var ATTACK = 1; //attack with ball
static var HELP = 2; //if a partner has the ball: this player will help
static var DEFEND = 0; //an opponent has the ball: defend, trying to not be burned 

private var action = HELP; //current action. by default is help

private var s_BallPlayer: BallPlayer; //scripts
private var s_ballControl : BallControl;

private var addedPower = 300; //TODO: variable
//private var vError : int; //for aim. TODO
//private var hError : int;

private var timeToMovePosition = 3.0;

private var s_PrisonRules : PrisonRules;

function Start () {
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
	
	characterController = GetComponent(CharacterController);
	if (!target)
		target = GameObject.FindWithTag("Ball").transform;
			
	s_BallPlayer = gameObject.GetComponent(BallPlayer);
	s_ballControl = GameObject.FindGameObjectWithTag("Ball").GetComponent(BallControl);
	
			
	// By default loop all animations
	animation.wrapMode = WrapMode.Loop;

	animation["run"].layer = -1;
	animation["walk"].layer = -1;
	animation["idle"].layer = -2;
	animation.SyncLayer(-1);

	animation["ledgefall"].layer = 9;	
	animation["ledgefall"].wrapMode = WrapMode.Loop;


	// The jump animation is clamped and overrides all others
	animation["jump"].layer = 10;
	animation["jump"].wrapMode = WrapMode.ClampForever;

	animation["jumpfall"].layer = 10;	
	animation["jumpfall"].wrapMode = WrapMode.ClampForever;

	// This is the jet-pack controlled descent animation.
	animation["jetpackjump"].layer = 10;	
	animation["jetpackjump"].wrapMode = WrapMode.ClampForever;

	animation["jumpland"].layer = 10;	
	animation["jumpland"].wrapMode = WrapMode.Once;

	animation["walljump"].layer = 11;	
	animation["walljump"].wrapMode = WrapMode.Once;

	// we actually use this as a "got hit" animation
	animation["buttstomp"].speed = 0.15;
	animation["buttstomp"].layer = 20;
	animation["buttstomp"].wrapMode = WrapMode.Once;	
	var punch = animation["punch"];
	punch.wrapMode = WrapMode.Once;

	// We are in full control here - don't let any other animations play when we start
	animation.Stop();
	animation.Play("idle");
	
	// initialize audio clip. Make sure it's set to the "idle" sound.
	//audio.clip = idleSound;
	
	yield WaitForSeconds(Random.value);
	
	// Just attack for now
	/*while (true)	
	{

		//if (!this.GetComponent(IAPlayerBall).getHasBall()) {
		
			// Don't do anything when idle. And wait for player to be in range!
			// This is the perfect time for the player to attack us
			yield Idle();
	
			// Prepare, turn to player and attack him
			yield Attack();
		//}
	}*/
}


function Idle () {
	
	// Don't do anything when idle
	// The perfect time for the player to attack us
	yield WaitForSeconds(idleTime);
	
	while (true) {
		characterController.SimpleMove(Vector3.zero); //TODO: mover en direccion por defecto que le corresponda por area
		yield WaitForSeconds(0.2);
		
		var offset = transform.position - target.position;
		
		// if player is in range again, stop lazyness
		// Good Hunting!		
		if (offset.magnitude < attackDistance)
			return;
	}
} 

function RotateTowardsPosition (targetPos : Vector3, rotateSpeed : float) : float
{
	// Compute relative point and get the angle towards it
	var relative = transform.InverseTransformPoint(targetPos);
	var angle = Mathf.Atan2 (relative.x, relative.z) * Mathf.Rad2Deg;
	// Clamp it with the max rotation speed
	var maxRotation = rotateSpeed * Time.deltaTime;
	var clampedAngle = Mathf.Clamp(angle, -maxRotation, maxRotation);
	// Rotate
	transform.Rotate(0, clampedAngle, 0);
	// Return the current angle
	return angle;
}

function Attack () {
	isAttacking = true;
	
	// Already queue up the attack run animation but set it's blend wieght to 0
	// it gets blended in later
	// it is looping so it will keep playing until we stop it.
	animation.Play("idle");
	
	// First we wait for a bit so the player can prepare while we turn around
	// As we near an angle of 0, we will begin to move
	var angle : float = 180.0;
	var time : float = 0.0;
	var direction : Vector3;
	var move : float;
	
	//girar en direccion a target, con animacion caminando
	while (angle > 5 || time < attackTurnTime)
	{
		time += Time.deltaTime;
		angle = Mathf.Abs(RotateTowardsPosition(target.position, rotateSpeed));
		move = Mathf.Clamp01((90 - angle) / 90);
		
		// depending on the angle, start moving
		animation["idle"].weight = animation["idle"].speed = move;
		//direction = transform.TransformDirection(Vector3.forward * attackSpeed * move);
		//characterController.SimpleMove(direction);
		
		yield;
	}
	
	// Espera a que la tire

	var timer = 0.0;
	var lostSight = false;
	//animation.CrossFade("jump");
	
	isAttacking = false;
	
	// Now we can go back to playing the idle animation
	animation.CrossFade("idle");
}


function SetAttack() { //pone en posicion de ataque cuando en IAPlayerBall.js coge pelota
	target = GameObject.FindWithTag("Player").transform;  //TODO que este en el area contraria para brilar*/
	//if (s_BallPlayer.GetTeam()
	//target = s_PrisonRules.NearestPlayer(s_BallPlayer.GetPlayerID(), -1, 2).transform;
	action = ATTACK;
}


function SetDefend() { //pone en posicion de defensa cuando en IAPlayerBall.js tira pelota
	target = GameObject.FindWithTag("Ball").transform; //interesting use Find to take a bit latency: is normal in a person
	action = DEFEND;
	//print("SetDefend finish of player " + GetComponent(BallPlayer).GetPlayerID());
}

function SetHelp() { //pone en posicion de defensa cuando en IAPlayerBall.js tira pelota
	target = GameObject.FindWithTag("Ball").transform; //XXX: maybe other target
	action = HELP;
	SendMessage("MoveToDefault", timeToMovePosition);
	yield WaitForSeconds(timeToMovePosition + 2);;
	animation.CrossFade("idle");	
	//print("SetHelp finish of player " + GetComponent(BallPlayer).GetPlayerID());
}


function Update() {
	//if (this.GetComponent(IAPlayerBall).GetHasBall())
	//	target = GameObject.FindWithTag("Player").transform;  //que este en el area contraria para brilar*/
		
	var offset = transform.position - target.position;
			
	if (offset.magnitude < attackDistance) { //si el objetivo esta en un radio
		switch (action) {
		case DEFEND:
			//TODO: dependiendo de situacion, de nivel de dificultad, etc, tendra un comportamiento diferente
			//IA_TryStealBall();
			IA_TryEscape();
			break;
		case HELP:
			IA_Help();
			break;
		case ATTACK:
			IA_TryBurn();
			break;
		default:
			animation.CrossFade("idle");
		} //switch
		
	} //en rango
	else
		animation.CrossFade("idle");		

}


function IA_TryStealBall() {
	var angle : float = 180.0;
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
	
	yield;
}


function IA_TryEscape() {
	var angle : float = 180.0;
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
	}
	
	yield;
}


function IA_TryBurn() {
	
	if ((!s_BallPlayer.HasBall()) && (!s_ballControl.IsCaught())) //si no tiene pelota y no esta cogida por nadie, intenta cogerla
		gameObject.SendMessage("TryCatchBall");
	else	
	if (s_BallPlayer.HasBall()) {
		yield WaitForSeconds(5);
		//TODO: gameObject.GetComponent(BallPlayer).AimBall(v, h);
		s_BallPlayer.AimBall(0.5, 0.5); //apuntar con la pelota
		gameObject.SendMessage("TryThrowBall", addedPower); //TODO: change power
		
	}
	//TODO: apuntar a jugador y tirar
	yield;
}


function IA_Help() {
	//animation.CrossFade("idle");	
	yield;
}


function OnDrawGizmosSelected ()
{
	Gizmos.color = Color.yellow;
	Gizmos.DrawWireSphere (transform.TransformPoint(punchPosition), punchRadius);
	Gizmos.color = Color.red;
	Gizmos.DrawWireSphere (transform.position, attackDistance);
}
