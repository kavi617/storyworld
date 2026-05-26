import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { entity } from './entity.js';

export const player_entity = (() => {

  class BasicCharacterController extends entity.Component {
    constructor(params) {
      super();
      this._Init(params);
    }

    _Init(params) {
      this._params = params;
      this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
      this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
      this._velocity = new THREE.Vector3(0, 0, 0);
      this._position = new THREE.Vector3();
      
      this._mixer = null;
      this._idleAction = null;
      this._walkAction = null;
      this._currentAction = null;
      
      // Don't load models yet - wait for InitComponent
    }

    InitComponent() {
      // Now load models after parent is set
      this._LoadModels();
    }

    _LoadModels() {
      const loader = new FBXLoader();
      
      // Load the idle pose model (Remy.fbx)
      loader.load('characters/main character/Remy.fbx', (fbx) => {
        this._target = fbx;
        this._target.scale.setScalar(0.01); // Scale down (adjust as needed)
        this._target.position.set(0, 0, 0);
        this._params.scene.add(this._target);
        
        // Setup shadows
        this._target.traverse(c => {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material && c.material.map) {
            c.material.map.encoding = THREE.sRGBEncoding;
          }
        });
        
        // Setup animation mixer
        this._mixer = new THREE.AnimationMixer(this._target);
        
        // If Remy.fbx has an animation, use it as idle
        if (fbx.animations && fbx.animations.length > 0) {
          const idleClip = fbx.animations[0];
          
          // Remove position tracks from idle too
          const filteredTracks = idleClip.tracks.filter(track => {
            return !track.name.includes('.position');
          });
          
          const cleanIdleClip = new THREE.AnimationClip(
            idleClip.name,
            idleClip.duration,
            filteredTracks
          );
          
          this._idleAction = this._mixer.clipAction(cleanIdleClip);
          this._idleAction.play();
          this._currentAction = this._idleAction;
          console.log('Idle animation loaded from Remy.fbx (position tracks removed)');
        }
        
        // Update entity position immediately
        this._position.copy(this._target.position);
        this._parent.SetPosition(this._position);
        this._parent.SetQuaternion(this._target.quaternion);
        
        console.log('Remy character loaded with idle pose');
        
        // Now load the walking animation
        this._LoadWalkingAnimation();
      }, 
      (xhr) => {
        console.log('Loading Remy: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading Remy model:', error);
        this._CreateFallbackBox();
      });
    }
    
    _LoadWalkingAnimation() {
      const loader = new FBXLoader();
      
      loader.load('characters/main character/Walking.fbx', (walkFbx) => {
        if (walkFbx.animations && walkFbx.animations.length > 0) {
          const walkClip = walkFbx.animations[0];
          
          // Remove position/translation tracks to prevent root motion
          const filteredTracks = walkClip.tracks.filter(track => {
            // Keep only rotation and scale tracks, remove position tracks
            return !track.name.includes('.position');
          });
          
          // Create new clip without position tracks
          const cleanClip = new THREE.AnimationClip(
            walkClip.name,
            walkClip.duration,
            filteredTracks
          );
          
          this._walkAction = this._mixer.clipAction(cleanClip);
          this._walkAction.clampWhenFinished = false;
          
          console.log('Walking animation loaded (position tracks removed)');
        } else {
          console.log('No animation in Walking.fbx - it may be a static pose');
        }
      },
      (xhr) => {
        console.log('Loading walking animation: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error loading walking animation:', error);
      });
    }
    
    _CreateFallbackBox() {
      console.log('Using fallback box geometry');
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
      this._target = new THREE.Mesh(geometry, material);
      this._target.castShadow = true;
      this._target.position.set(0, 1, 0);
      this._params.scene.add(this._target);
      
      this._position.copy(this._target.position);
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
      
      console.log('Fallback character loaded');
    }

    Update(timeInSeconds) {
      if (!this._target) {
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      if (!input) {
        return;
      }
      
      // Check if character is moving
      const isMoving = input._keys.forward || input._keys.backward || 
                       input._keys.left || input._keys.right;
      
      // Switch between idle and walking animations
      if (this._idleAction && this._walkAction) {
        if (isMoving && this._currentAction !== this._walkAction) {
          // Switch to walking
          this._idleAction.fadeOut(0.2);
          this._walkAction.reset().fadeIn(0.2).play();
          this._currentAction = this._walkAction;
        } else if (!isMoving && this._currentAction !== this._idleAction) {
          // Switch to idle
          this._walkAction.fadeOut(0.2);
          this._idleAction.reset().fadeIn(0.2).play();
          this._currentAction = this._idleAction;
        }
      } else if (this._walkAction) {
        // If we only have walk action (no idle), just play/stop it
        if (isMoving && !this._walkAction.isRunning()) {
          this._walkAction.play();
        } else if (!isMoving && this._walkAction.isRunning()) {
          this._walkAction.stop();
        }
      }

      const velocity = this._velocity;
      const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
      );
      frameDecceleration.multiplyScalar(timeInSeconds);
      frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

      velocity.add(frameDecceleration);

      const controlObject = this._target;
      const _Q = new THREE.Quaternion();
      const _A = new THREE.Vector3();
      const _R = controlObject.quaternion.clone();

      const acc = this._acceleration.clone();
      if (input._keys.shift) {
        acc.multiplyScalar(2.0);
      }

      if (input._keys.forward) {
        velocity.z += acc.z * timeInSeconds;
      }
      if (input._keys.backward) {
        velocity.z -= acc.z * timeInSeconds;
      }
      if (input._keys.left) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }
      if (input._keys.right) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
        _R.multiply(_Q);
      }

      controlObject.quaternion.copy(_R);

      const oldPosition = new THREE.Vector3();
      oldPosition.copy(controlObject.position);

      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();

      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();

      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);

      const pos = controlObject.position.clone();
      pos.add(forward);
      pos.add(sideways);

      // Force the position (ignore any root motion from animation)
      controlObject.position.copy(pos);
      this._position.copy(pos);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);
      
      // Update animation mixer AFTER position updates to prevent animation from overriding
      if (this._mixer) {
        this._mixer.update(timeInSeconds);
        
        // Force position again after mixer update to override root motion
        controlObject.position.copy(this._position);
      }
    }
  }

  return {
    BasicCharacterController: BasicCharacterController,
  };

})();
