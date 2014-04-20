
//inspirado en Pickup.js

//codigo de prueba para que un objeto al cogerse, desactive los limites del campo

var sound : AudioClip;
var soundVolume : float = 2.0;


private var used = false;
private var limitsActivated = true;
//private var mover : DroppableMover;

//private var playerdID = 1;
//private var script_PrisonRules : PrisonRules;


function Start ()
{
	// do we exist in the level or are we instantiated by an enemy dying?
	mover = GetComponent(DroppableMover);
	//script_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
}


function OnTriggerEnter (col : Collider) {
	
	//* Make sure we are running into a player
	//* prevent picking up the trigger twice, because destruction
	//  might be delayed until the animation has finished
	/*if (used || playerStatus == null)
		return;*/

	if (used)
		return;

	used = true;
	
	
	var limits = GameObject.FindWithTag("Ground");
	if (limits != null) {
		/*var colliders : Component[];
		
		colliders = limits.GetComponentsInChildren(Collider);
		for (var col2 : Collider in colliders) {
    		col2.enabled = false;
		}
		
		limitsActivated = false;*/
		limits.GetComponent(GroundControl).SetStateLimits(false); //al ser tocado desactiva limites del campo
		
		//GameObject.Find("Ball").GetComponent(Collider).isTrigger = 	true;
	}

	//script_PrisonRules.OnBallGrounded();
		
	// Play sound
	if (sound)
		AudioSource.PlayClipAtPoint(sound, transform.position, soundVolume);
		
	
	
	// If there is an animation attached.
	// Play it.
	if (animation && animation.clip)
	{
		animation.Play();
		Destroy(gameObject, animation.clip.length);
	}
	else
	{
		Destroy(gameObject);
	}
}


//reinicia el pickup
function Reset ()
{
	used = false;
	if (collider == null)	
		gameObject.AddComponent(BoxCollider);
	collider.isTrigger = true;
}