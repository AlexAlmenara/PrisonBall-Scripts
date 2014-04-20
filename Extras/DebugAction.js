
/*inspirated in Pickup.js of 3DPlatform

Test code for debug. used to attach to some pickup object. when someone touches the pickup, a debug action will be activated.
Implemented actions until now:
- Set ground limits off
- Reorganize players

*/

var sound : AudioClip;
var soundVolume : float = 2.0;


private var used = false;
private var limitsActivated = true;
private var s_PrisonRules : PrisonRules;


function Start () {
	mover = GetComponent(DroppableMover);
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules);
}


function OnTriggerEnter (col : Collider) {
	
	// prevent picking up the trigger twice, because destruction might be delayed until the animation has finished
	if (used)
		return;

	used = true;
	
	//***************** Action: ground limits off ***********************************************************
	/*var limits = GameObject.FindWithTag("Ground");
	if (limits != null) {
		limits.GetComponent(GroundControl).SetStateLimits(false); //al ser tocado desactiva limites del campo
		
		//GameObject.Find("Ball").GetComponent(Collider).isTrigger = true;
	}*/
	//s_PrisonRules.OnBallGrounded();
		
		
	//********** Action: Reorganize Players *****************************************************************
	/*yield WaitForSeconds(2); //wait for not to move the player before. useful to debug the default rotation
	s_PrisonRules.ReorganizePlayers();*/
	
	
	//********** Action: Burn the player who has collisioned
	//print("try burn");
	//s_PrisonRules.BurnPassPlayer(col.gameObject.GetComponent(PlayerBallController).GetPlayerID());
	//s_PrisonRules.BurnPassPlayer(2);
	//Input.ResetInputAxes();
	//col.SendMessage("SetDebug", true);
	/*yield WaitForSeconds(1);
	col.SendMessage("IRotateToDefault");*/
	//col.SendMessage("AutoRotate", Quaternion.Euler(0, 180, 0)); //from Euler degrees, returns the rotation.
	//yield WaitForSeconds(2);
	//col.SendMessage("SetKeyGamer1");
	//col.SendMessage("IRotateTo", Quaternion.Euler(0, 180, 0));
	
	
	
	//************ Action: rotate player *************************************
	var target = GameObject.FindWithTag("Ground").transform;
	col.gameObject.GetComponent(PlayerMoveController).RotateTo(target.position, 100, 5);
	//******** end actions
	
	//Play sound
	if (sound)
		AudioSource.PlayClipAtPoint(sound, transform.position, soundVolume);
	
	// If there is an animation attached, play it.
	if (animation && animation.clip){
		animation.Play();
		Destroy(gameObject, animation.clip.length);
	}
	else
		Destroy(gameObject);
}


//reinicia el pickup
function Reset () {
	used = false;
	if (collider == null)	
		gameObject.AddComponent(BoxCollider);
	collider.isTrigger = true;
}