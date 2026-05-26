import * as THREE from 'three';
import { entity } from './entity.js';

export const third_person_camera = (() => {
  
  class ThirdPersonCamera extends entity.Component {
    constructor(params) {
      super();

      this._params = params;
      this._camera = params.camera;

      this._currentPosition = new THREE.Vector3();
      this._currentLookat = new THREE.Vector3();
      
      // Mouse rotation (set externally)
      this._mouseRotationY = 0;
      this._mouseRotationX = 0;
      
      // Zoom distance
      this._zoomDistance = 15; // Default distance
      this._minZoom = 5;
      this._maxZoom = 30;
    }

    InitComponent() {
      // Initialize camera position immediately
      this._currentPosition.copy(this._CalculateIdealOffset());
      this._currentLookat.copy(this._CalculateIdealLookat());
      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }

    _CalculateIdealOffset() {
      // Camera orbits around character based on mouse movement
      const horizontalDistance = this._zoomDistance;
      const verticalHeight = 8;
      
      // Get character rotation
      const characterRotation = new THREE.Euler();
      characterRotation.setFromQuaternion(this._params.target._rotation);
      
      // Total yaw is character rotation + mouse horizontal rotation
      const totalYaw = characterRotation.y + this._mouseRotationY;
      
      // Calculate camera height with mouse vertical rotation
      let cameraHeight = verticalHeight + (this._mouseRotationX * 8);
      
      // CRITICAL: Prevent camera from going below ground (minimum height 1.5 units)
      const minCameraHeight = 1.5;
      cameraHeight = Math.max(cameraHeight, minCameraHeight);
      
      // Position camera behind and above character
      const idealOffset = new THREE.Vector3(
        -horizontalDistance * Math.sin(totalYaw),
        cameraHeight,
        -horizontalDistance * Math.cos(totalYaw)
      );
      
      idealOffset.add(this._params.target._position);
      return idealOffset;
    }

    _CalculateIdealLookat() {
      // Look at character center with upward offset
      const lookAtHeight = 2;
      const idealLookat = new THREE.Vector3(0, lookAtHeight, 0);
      idealLookat.add(this._params.target._position);
      return idealLookat;
    }

    
    SetZoom(distance) {
      // Clamp zoom between min and max
      this._zoomDistance = Math.max(this._minZoom, Math.min(this._maxZoom, distance));
    }

    Update(timeElapsed) {
      const idealOffset = this._CalculateIdealOffset();
      const idealLookat = this._CalculateIdealLookat();

      // Smooth camera follow
      const t = 1.0 - Math.pow(0.01, timeElapsed);

      this._currentPosition.lerp(idealOffset, t);
      this._currentLookat.lerp(idealLookat, t);

      this._camera.position.copy(this._currentPosition);
      this._camera.lookAt(this._currentLookat);
    }
  }

  return {
    ThirdPersonCamera: ThirdPersonCamera
  };

})();
