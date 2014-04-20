#pragma strict

var runSpeedScale = 1.0;
var walkSpeedScale = 1.0;

var throwSpeed = 1;

private var playerController : PlayerMoveController;
private var currentSpeed : float;

var playerID = -1; //TODO: quit this, only for debug

//TODO: maybe set the names of animations as variables. useful for different GameObjects of player

function Start() { //called after Awake of PlayerMoveController
 	playerController = GetComponent(PlayerMoveController);

	// By default loop all animations
	animation.wrapMode = WrapMode.Loop;

	animation["run"].layer = -1;
	animation["walk"].layer = -1;
	animation["idle"].layer = -2;
	animation.SyncLayer(-1);

	animation["ledgefall"].layer = 9;	
	animation["ledgefall"].wrapMode = WrapMode.Loop;

	animation["punch"].layer = 10;
	animation["punch"].speed = throwSpeed;
	animation["punch"].wrapMode = WrapMode.Once;
	
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

	animation["gothit"].speed = 0.15; //when player receive hit of ball
	animation["gothit"].layer = 20;
	animation["gothit"].wrapMode = WrapMode.Once;

	// We are in full control here - don't let any other animations play when we start
	animation.Stop();
	animation.Play("idle");
	yield WaitForSeconds(2);
	//playerID = GetComponent(PlayerBallController).GetPlayerID();
}


function Update () { //read current speed from PlayerMoveController and check if he's jumping: decide animation
	currentSpeed = playerController.GetSpeed();

	if (!playerID)
		print("isJumping:" + playerController.IsJumping() + ", isControlledDescent:" + playerController.IsControlledDescent() 
		+ ", hasjumpreachedapex:" + playerController.HasJumpReachedApex()
		+ ", isgroundedwithtimeout:" + playerController.IsGroundedWithTimeout());
	
	// Fade in run
	if (currentSpeed > playerController.walkSpeed) {
		animation.CrossFade("run");
		animation.Blend("jumpland", 0); // We fade out jumpland quick otherwise we get sliding feet
	}
	else if (currentSpeed > 0.1) { // Fade in walk
		animation.CrossFade("walk");
		animation.Blend("jumpland", 0); // We fade out jumpland realy quick otherwise we get sliding feet
	}
	else { // Fade out walk and run
		animation.Blend("walk", 0.0, 0.3);
		animation.Blend("run", 0.0, 0.3);
		animation.Blend("run", 0.0, 0.3);
	}
	
	animation["run"].normalizedSpeed = runSpeedScale;
	animation["walk"].normalizedSpeed = walkSpeedScale;
	
	if (playerController.IsJumping())
	{
		if (playerController.IsControlledDescent())
			animation.CrossFade("jetpackjump", 0.2);
		else if (playerController.HasJumpReachedApex())
			animation.CrossFade("jumpfall", 0.2);
		else
			animation.CrossFade("jump", 0.2);
			
	}
	else if (!playerController.IsGroundedWithTimeout()) // We fell down somewhere
 		animation.CrossFade("ledgefall", 0.2);
	
	else
		animation.Blend("ledgefall", 0.0, 0.2); // We are not falling down anymore
}


function DidLand () {
	//animation.Blend("jumpland", 0);
	animation.Play("jumpland");
}

function GotHit() {
	animation.CrossFade("gothit", 0.2);
	yield WaitForSeconds(2);
	animation.Blend("gothit", 0, 0);
}


function TryThrowBall() { //when try throw ball. note is the same name in PlayerBallController, so both messages will be called
	animation.CrossFadeQueued("punch", 0.1, QueueMode.PlayNow); //the movement will be occur, although the player hasn't the ball
}

function TryCatchBall() { //when try catch ball. note is the same name in PlayerBallController, so both messages will be called
	animation.CrossFadeQueued("punch", 0.1, QueueMode.PlayNow); //TODO: change animation
}


/*function AddAnimationTransform(trans: Transform) {
	animation["walk"].AddMixingTransform(trans);
	animation["run"].AddMixingTransform(trans);
}

function RemoveAnimationTransform(trans: Transform) {
	animation["walk"].RemoveMixingTransform(trans);
	animation["run"].RemoveMixingTransform(trans);
}*/

/*when IAPlayer almost try catch ball only do a minimum movement.
 note is the same name in PlayerBallController, so both messages will be called */
function AlmostTryCatchBall() { 
	//animation.CrossFadeQueued("punch", 0.1, QueueMode.PlayNow); //TODO: change animation
}

@script AddComponentMenu ("Third Person Player/Player Animation")
@script RequireComponent(Animation)
@script RequireComponent(PlayerMoveController)