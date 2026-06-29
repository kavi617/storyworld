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
      this._gravity = -25;
      this._jumpStrength = 10;
      this._groundLevel = 0;
      this._position = new THREE.Vector3();
      this._raycaster = new THREE.Raycaster();
      this._collisionDistance = 3;
      this._mixer = null;
      this._idleAction = null;
      this._walkAction = null;
      this._currentAction = null;
    }

    InitComponent() {
      this._LoadModels();
    }

    _optimizeMaterials(object) {
      const unused = ["tangent", "uv1", "uv2"];
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          child.frustumCulled = true;
          child.matrixAutoUpdate = false;
          child.updateMatrix();
          if (child.geometry) {
            for (const name of unused) {
              if (child.geometry.attributes[name]) child.geometry.deleteAttribute(name);
            }
          }
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (let i = 0; i < mats.length; i++) {
              const orig = mats[i];
              if (orig.type !== 'MeshBasicMaterial') {
                const basic = new THREE.MeshBasicMaterial({
                  color: orig.color || 0xcccccc,
                  map: orig.map || null,
                  transparent: orig.transparent || false,
                  opacity: orig.opacity || 1.0,
                });
                if (Array.isArray(child.material)) {
                  child.material[i] = basic;
                } else {
                  child.material = basic;
                }
              }
            }
          }
        }
      });
    }

    _LoadModels() {
      const loader = new FBXLoader();

      loader.load('characters/main character/Remy.fbx', (fbx) => {
        this._target = fbx;
        this._target.scale.setScalar(0.01);
        this._optimizeMaterials(this._target);

        const gameConfig = window.gameConfig || { world: 'nature' };
        if (gameConfig.world === 'architecture') {
          this._target.position.set(0, 0, -115);
          this._target.rotation.y = 0;
        } else if (gameConfig.world === 'water') {
          this._target.position.set(26.5, 1.5, -70);
          this._target.rotation.y = 0;
        } else {
          this._target.position.set(0, 0, 0);
        }

        this._params.scene.add(this._target);

        this._mixer = new THREE.AnimationMixer(this._target);

        if (fbx.animations && fbx.animations.length > 0) {
          const idleClip = fbx.animations[0];
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
        }

        this._position.copy(this._target.position);
        this._parent.SetPosition(this._position);
        this._parent.SetQuaternion(this._target.quaternion);

        if (window.gameLoading) {
          window.gameLoading.completeTask('player');
        }

        this._LoadWalkingAnimation();
      },
      (xhr) => {
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
          const filteredTracks = walkClip.tracks.filter(track => {
            return !track.name.includes('.position');
          });
          const cleanClip = new THREE.AnimationClip(
            walkClip.name,
            walkClip.duration,
            filteredTracks
          );
          this._walkAction = this._mixer.clipAction(cleanClip);
          this._walkAction.clampWhenFinished = false;
        }
      },
      (xhr) => {
      },
      (error) => {
        console.error('Error loading walking animation:', error);
      });
    }

    _CreateFallbackBox() {
      console.log('Using fallback box geometry');
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xff6347 });
      this._target = new THREE.Mesh(geometry, material);
      this._target.castShadow = false;
      this._target.receiveShadow = false;

      const gameConfig = window.gameConfig || { world: 'nature' };
      if (gameConfig.world === 'architecture') {
        this._target.position.set(0, 1, 80);
      } else if (gameConfig.world === 'water') {
        this._target.position.set(26.5, 2, -70);
      } else {
        this._target.position.set(0, 1, 0);
      }

      this._params.scene.add(this._target);

      this._position.copy(this._target.position);
      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);

      if (window.gameLoading) {
        window.gameLoading.completeTask('player');
      }
    }

    Update(timeInSeconds) {
      if (!this._target) {
        return;
      }

      if (!window.gameLoaded) {
        return;
      }

      const input = this.GetComponent('BasicCharacterControllerInput');
      if (!input) {
        return;
      }

      const isMoving = input._keys.forward || input._keys.backward ||
                       input._keys.left || input._keys.right;

      if (this._idleAction && this._walkAction) {
        if (isMoving && this._currentAction !== this._walkAction) {
          this._idleAction.fadeOut(0.2);
          this._walkAction.reset().fadeIn(0.2).play();
          this._currentAction = this._walkAction;
        } else if (!isMoving && this._currentAction !== this._idleAction) {
          this._walkAction.fadeOut(0.2);
          this._idleAction.reset().fadeIn(0.2).play();
          this._currentAction = this._idleAction;
        }
      } else if (this._walkAction) {
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

      if (input._keys.space && !this._isJumping && controlObject.position.y <= this._groundLevel + 0.2) {
        this._isJumping = true;
        this._jumpVelocity = this._jumpStrength;
      }

      if (this._isJumping || controlObject.position.y > this._groundLevel) {
        this._jumpVelocity += this._gravity * timeInSeconds;
        controlObject.position.y += this._jumpVelocity * timeInSeconds;

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

      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(controlObject.quaternion);
      forward.normalize();

      const sideways = new THREE.Vector3(1, 0, 0);
      sideways.applyQuaternion(controlObject.quaternion);
      sideways.normalize();

      sideways.multiplyScalar(velocity.x * timeInSeconds);
      forward.multiplyScalar(velocity.z * timeInSeconds);

      const pos = controlObject.position.clone();

      const moveVector = new THREE.Vector3();
      moveVector.add(forward);
      moveVector.add(sideways);

      let canMove = true;

      if (window.getCollisionMeshes && typeof window.getCollisionMeshes === 'function') {
        const wallMeshes = window.getCollisionMeshes();

        if (wallMeshes && wallMeshes.length > 0 && moveVector.length() > 0.01) {
          const direction = moveVector.clone().normalize();
          direction.y = 0;

          const rayOrigins = [
            new THREE.Vector3(controlObject.position.x, controlObject.position.y + 0.3, controlObject.position.z),
            new THREE.Vector3(controlObject.position.x, controlObject.position.y + 1.0, controlObject.position.z),
          ];

          for (const origin of rayOrigins) {
            this._raycaster.set(origin, direction);
            const intersects = this._raycaster.intersectObjects(wallMeshes, true);
            if (intersects.length > 0 && intersects[0].distance < this._collisionDistance) {
              canMove = false;
              break;
            }
          }
        }
      }

      if (canMove) {
        pos.add(moveVector);
      }

      const downRay = new THREE.Raycaster(
        new THREE.Vector3(pos.x, pos.y + 5, pos.z),
        new THREE.Vector3(0, -1, 0)
      );

      let groundDetected = false;

      const groundMeshList = (window.getGroundMeshes && window.getGroundMeshes())
        || (window.getCollisionMeshes && window.getCollisionMeshes())
        || [];

      if (groundMeshList.length > 0) {
        const groundIntersects = downRay.intersectObjects(groundMeshList, true);

        if (groundIntersects.length > 0) {
          groundDetected = true;
          const groundY = groundIntersects[0].point.y;
          const heightDiff = groundY - pos.y;

          if (!this._isJumping) {
            if (heightDiff <= 5.0) {
              pos.y = groundY;
              this._groundLevel = groundY;
            }
          } else {
            if (pos.y <= groundY && heightDiff <= 0) {
              pos.y = groundY;
              this._groundLevel = groundY;
              this._isJumping = false;
              this._jumpVelocity = 0;
            }
          }
        }
      }

      if (!groundDetected && !this._isJumping) {
        if (pos.y > 0.5) {
          this._isJumping = true;
        } else {
          pos.y = 0;
          this._groundLevel = 0;
        }
      }

      controlObject.position.copy(pos);
      this._position.copy(pos);

      this._parent.SetPosition(this._position);
      this._parent.SetQuaternion(this._target.quaternion);

      if (this._mixer) {
        this._mixer.update(timeInSeconds);
        controlObject.position.copy(this._position);
      }
    }
  }

  return {
    BasicCharacterController: BasicCharacterController,
  };

})();
