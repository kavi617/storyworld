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
      this._isJumping = false;
      this._jumpVelocity = 0;
      this._gravity = -25; // Gravity acceleration
      this._jumpStrength = 10; // Initial jump velocity
      this._groundLevel = 0; // Will be updated based on terrain
      this._position = new THREE.Vector3();
      this._raycaster = new THREE.Raycaster();
      this._collisionDistance = 3; // Increased detection distance to prevent phasing
      
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
        
        // Set spawn position based on world type
        const gameConfig = window.gameConfig || { world: 'nature' };
        if (gameConfig.world === 'architecture') {
          // Spawn on the main kolam outside the compound entrance
          this._target.position.set(0, 0, -115);
          this._target.rotation.y = 0; // Face toward +Z (toward temple)
          console.log('🏗️ Player spawned on kolam at (0, 0, -115) facing temple');
        } else if (gameConfig.world === 'water') {
          // Spawn on river pathway to start exploration
          this._target.position.set(26.5, 1.5, -70);  // On pathway near river start
          this._target.rotation.y = 0;  // Facing downstream toward dam
          console.log('💧 Player spawned on river pathway at (26.5, 1.5, -70)');
        } else {
          this._target.position.set(0, 0, 0);
        }
        
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
        
        // Update loading state
        if (window.loadingState) {
            window.loadingState.player = true;
            window.updateLoadingProgress();
        }
        
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
      
      // Set spawn position based on world type
      const gameConfig = window.gameConfig || { world: 'nature' };
      if (gameConfig.world === 'architecture') {
        this._target.position.set(0, 1, 80);
      } else if (gameConfig.world === 'water') {
        this._target.position.set(26.5, 2, -70);  // On river pathway
      } else {
        this._target.position.set(0, 1, 0);
      }
      
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
      
      // Don't process input until game is fully loaded
      if (!window.gameLoaded) {
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
      
      // Jump mechanic
      if (input._keys.space && !this._isJumping && controlObject.position.y <= this._groundLevel + 0.2) {
        this._isJumping = true;
        this._jumpVelocity = this._jumpStrength;
      }
      
      // Apply gravity and jump
      if (this._isJumping || controlObject.position.y > this._groundLevel) {
        this._jumpVelocity += this._gravity * timeInSeconds;
        controlObject.position.y += this._jumpVelocity * timeInSeconds;
        
        // Land on ground
        if (controlObject.position.y <= this._groundLevel) {
          controlObject.position.y = this._groundLevel;
          this._isJumping = false;
          this._jumpVelocity = 0;
        }
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
      const oldY = pos.y; // Store Y before movement
      
      const moveVector = new THREE.Vector3();
      moveVector.add(forward);
      moveVector.add(sideways);
      
      // ═══════════════════════════════════════════════════════════════
      // ENHANCED COLLISION DETECTION - Multiple raycasts
      // ═══════════════════════════════════════════════════════════════
      
      let canMove = true;
      
      // Horizontal collision: only check wall colliders (NOT temple mesh geometry)
      // This allows walking up stairs freely while walls prevent phasing
      if (window.getCollisionMeshes && typeof window.getCollisionMeshes === 'function') {
        const wallMeshes = window.getCollisionMeshes();
        
        if (wallMeshes && wallMeshes.length > 0 && moveVector.length() > 0.01) {
          const direction = moveVector.clone().normalize();
          direction.y = 0;
          
          // Check from foot, mid, and upper body
          const rayOrigins = [
            new THREE.Vector3(controlObject.position.x, controlObject.position.y + 0.3, controlObject.position.z),
            new THREE.Vector3(controlObject.position.x, controlObject.position.y + 1.0, controlObject.position.z),
          ];
          
          for (const origin of rayOrigins) {
            this._raycaster.set(origin, direction);
            const intersects = this._raycaster.intersectObjects(wallMeshes, true); // RECURSIVE for nested meshes
            if (intersects.length > 0 && intersects[0].distance < this._collisionDistance) {
              canMove = false;
              break;
            }
          }
        }
      }
      
      // Apply movement if allowed
      if (canMove) {
        pos.add(moveVector);
      }
      
      // ═══════════════════════════════════════════════════════════════
      // GROUND DETECTION - Use groundMeshes (includes temple stairs)
      // ═══════════════════════════════════════════════════════════════
      
      // Cast downward from above to detect ground/stairs
      const downRay = new THREE.Raycaster(
        new THREE.Vector3(pos.x, pos.y + 5, pos.z),
        new THREE.Vector3(0, -1, 0)
      );
      
      let groundDetected = false;
      
      // Prefer getGroundMeshes (includes temple stairs), fallback to getCollisionMeshes
      const groundMeshList = (window.getGroundMeshes && window.getGroundMeshes())
        || (window.getCollisionMeshes && window.getCollisionMeshes())
        || [];
      
      if (groundMeshList.length > 0) {
        const groundIntersects = downRay.intersectObjects(groundMeshList, true); // RECURSIVE to catch nested meshes
        
        if (groundIntersects.length > 0) {
          groundDetected = true;
          const groundY = groundIntersects[0].point.y;
          const heightDiff = groundY - pos.y; // positive = surface is above player
          
          if (!this._isJumping) {
            // Allow climbing stairs - increased threshold to 5 units for temple stairs
            // Always snap DOWN freely (falling off ledges)
            if (heightDiff <= 5.0) {
              pos.y = groundY;
              this._groundLevel = groundY;
            }
            // If heightDiff > 5.0, surface is too high (wall/roof) — ignore it
          } else {
            // While jumping, check landing
            if (pos.y <= groundY && heightDiff <= 0) {
              pos.y = groundY;
              this._groundLevel = groundY;
              this._isJumping = false;
              this._jumpVelocity = 0;
            }
          }
        }
      }
      
      // Fallback: use Y=0 if no ground detected
      if (!groundDetected && !this._isJumping) {
        if (pos.y > 0.5) {
          this._isJumping = true; // Start falling
        } else {
          pos.y = 0;
          this._groundLevel = 0;
        }
      }

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
