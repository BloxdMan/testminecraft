import * as THREE from 'three';
import { MobileControls } from './rosieMobileControls.js';

/**
 * PlayerController - Handles player movement and physics
 */
class PlayerController {
  constructor(player, options = {}) {
    this.player = player;

    // Configuration
    this.moveSpeed = options.moveSpeed || 10;
    this.jumpForce = options.jumpForce || 15;
    this.gravity = options.gravity || 30;
    this.groundLevel = options.groundLevel || 1; // Assuming base ground is at y=0, player bottom at y=0.4

    // State
    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    this.canJump = true;
    this.keys = {};
    this.cameraMode = 'third-person'; // Default camera mode

    // Setup input handlers
    this.setupInput();

    // Initialize mobile controls (handles its own detection and activation)
    this.mobileControls = new MobileControls(this);
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
  }

  /**
   * Updates the player's state, velocity, and position.
   * @param {number} deltaTime Time elapsed since the last frame.
   * @param {number} cameraRotation The current horizontal rotation (yaw) of the active camera.
   */
  update(deltaTime, cameraRotation) {
    // Apply gravity
    // Check if the player's base (center y - half height approx) is above ground
    // Note: Player model base is roughly at world y = player.position.y
    if (this.player.position.y > this.groundLevel) {
      this.velocity.y -= this.gravity * deltaTime;
      this.isOnGround = false;
    } else {
      // Clamp player to ground level and reset vertical velocity
      this.velocity.y = Math.max(0, this.velocity.y); // Stop downward velocity, allow upward (jump)
      this.player.position.y = this.groundLevel;
      this.isOnGround = true;
      this.canJump = true; // Can jump again once grounded
    }

    // Handle jumping
    if (this.keys['Space'] && this.isOnGround && this.canJump) {
      this.velocity.y = this.jumpForce;
      this.isOnGround = false;
      this.canJump = false; // Prevent double jumps until grounded again
    }

    // --- Horizontal Movement ---

    // Reset horizontal velocity each frame
    // We calculate desired movement directly based on input and camera
    let moveX = 0;
    let moveZ = 0;

    // Calculate movement direction vectors relative to the camera's horizontal rotation
    // Forward direction (local -Z) rotated by camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);
    // Right direction (local +X) rotated by camera yaw
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation);

    // Apply movement based on keys pressed
    const currentMoveSpeed = this.moveSpeed; // Use the configured move speed

    if (this.keys['KeyW']) { // Forward
      moveX += forward.x;
      moveZ += forward.z;
    }
    if (this.keys['KeyS']) { // Backward
      moveX -= forward.x;
      moveZ -= forward.z;
    }
    if (this.keys['KeyA']) { // Left
      moveX -= right.x;
      moveZ -= right.z;
    }
    if (this.keys['KeyD']) { // Right
      moveX += right.x;
      moveZ += right.z;
    }

    // Normalize the movement vector if moving diagonally
    const moveDirection = new THREE.Vector3(moveX, 0, moveZ);
    if (moveDirection.lengthSq() > 0) { // Check if there's any horizontal movement input
        moveDirection.normalize();
    }

    // Apply speed and deltaTime to get the displacement for this frame
    this.velocity.x = moveDirection.x * currentMoveSpeed;
    this.velocity.z = moveDirection.z * currentMoveSpeed;


    // --- Update Player Position ---
    // Apply calculated velocity scaled by deltaTime
    this.player.position.x += this.velocity.x * deltaTime;
    this.player.position.y += this.velocity.y * deltaTime; // Vertical velocity already includes gravity effect
    this.player.position.z += this.velocity.z * deltaTime;


    // --- Update Player Rotation ---
    // Rotate player model to face movement direction (only in third-person mode)
    // In first-person mode, the FirstPersonCameraController handles player rotation.
    if (this.cameraMode === 'third-person' && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
      // Calculate the angle of the horizontal velocity vector (world space)
      const angle = Math.atan2(this.velocity.x, this.velocity.z);

      // Set the player's rotation. Add Math.PI because the player's
      // "front" is along its local negative Z axis,
      // but atan2 gives the angle relative to the positive Z axis.
      // Adding PI rotates the model 180 degrees to align the negative Z axis
      // with the calculated movement direction.
      this.player.rotation.y = angle + Math.PI;
    }
     // If not moving in third-person, the player keeps their last rotation.
     // In first-person mode, the player's rotation is handled entirely by
     // the FirstPersonCameraController synchronizing with the mouse look.
  }

  destroy() {
    // Clean up mobile controls
    this.mobileControls.destroy();
  }
}

/**
 * ThirdPersonCameraController - Handles third-person camera positioning and rotation
 */
class ThirdPersonCameraController {
  constructor(camera, target, domElement, options = {}) {
    this.camera = camera;
    this.target = target;
    this.domElement = domElement;

    // Configuration
    this.distance = options.distance || 7;
    this.height = options.height || 3;
    this.rotationSpeed = options.rotationSpeed || 0.003;

    // State
    this.rotation = 0;
    this.isDragging = false;
    this.mousePosition = { x: 0, y: 0 };
    this.enabled = true;

    // Setup mouse controls
    this.setupMouseControls();
  }

  setupMouseControls() {
    // Mouse controls
    this.domElement.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      this.isDragging = true;
      this.mousePosition = { x: e.clientX, y: e.clientY };
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.isDragging) return;

      const deltaX = e.clientX - this.mousePosition.x;
      this.rotation -= deltaX * this.rotationSpeed;

      this.mousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch controls for mobile (only if mobile)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      let touchStart = null;
      
      this.domElement.addEventListener('touchstart', (e) => {
        if (!this.enabled || e.touches.length !== 1) return;
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchmove', (e) => {
        if (!this.enabled || !touchStart || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.x;
        this.rotation -= deltaX * this.rotationSpeed * 2; // Slightly more sensitive on mobile
        
        touchStart = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchend', (e) => {
        touchStart = null;
        e.preventDefault();
      });
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.isDragging = false;
  }

  update() {
    if (!this.enabled) return 0;

    // Calculate camera position
    const offset = new THREE.Vector3(
      Math.sin(this.rotation) * this.distance,
      this.height,
      Math.cos(this.rotation) * this.distance
    );

    // Position camera
    this.camera.position.copy(this.target.position).add(offset);

    // Look at target
    this.camera.lookAt(
      this.target.position.x,
      this.target.position.y + 1,
      this.target.position.z
    );

    return this.rotation; // Return rotation for player movement
  }

  destroy() {
    // Camera cleanup if needed
  }
}

/**
 * FirstPersonCameraController - Handles first-person camera controls
 */
class FirstPersonCameraController {
  constructor(camera, player, domElement, options = {}) {
    this.camera = camera;
    this.player = player;
    this.domElement = domElement;

    // Configuration
    this.eyeHeight = options.eyeHeight || 1.6;
    this.mouseSensitivity = options.mouseSensitivity || 0.002;

    // State
    this.enabled = false;
    this.rotationY = 0;
    this.rotationX = 0;

    // Setup mouse controls
    this.setupMouseControls();
  }

  setupMouseControls() {
    // Desktop pointer lock
    // Desktop pointer lock is now handled in main.js
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || document.pointerLockElement !== this.domElement) return;

      this.rotationY -= e.movementX * this.mouseSensitivity;
      this.rotationX -= e.movementY * this.mouseSensitivity;

      // Limit vertical rotation
      this.rotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.rotationX));
    });

    // Touch controls for mobile (only if mobile)
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      let touchStart = null;
      
      // Helper function to check if touch is over mobile UI elements
      const isTouchOverMobileUI = (touch) => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        return element && (
          element.id === 'mobile-game-controls' ||
          element.id === 'virtual-joystick' ||
          element.id === 'virtual-joystick-knob' ||
          element.id === 'jump-button' ||
          element.closest('#mobile-game-controls')
        );
      };
      
      this.domElement.addEventListener('touchstart', (e) => {
        if (!this.enabled || e.touches.length !== 1) return;
        
        // Don't handle touch if it's over mobile UI
        if (isTouchOverMobileUI(e.touches[0])) return;
        
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchmove', (e) => {
        if (!this.enabled || !touchStart || e.touches.length !== 1) return;
        
        // Don't handle touch if it started over mobile UI
        if (isTouchOverMobileUI(e.touches[0])) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        
        this.rotationY -= deltaX * this.mouseSensitivity * 2;
        this.rotationX -= deltaY * this.mouseSensitivity * 2;
        this.rotationX = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.rotationX));
        
        touchStart = { x: touch.clientX, y: touch.clientY };
        e.preventDefault();
      });

      this.domElement.addEventListener('touchend', (e) => {
        touchStart = null;
        e.preventDefault();
      });
    }
  }

  enable() {
    this.enabled = true;

    // Note: rotationY will be set by setCameraMode before this is called
    this.rotationX = 0;

    // Hide player when in first-person mode
    this.hidePlayer();
  }

  disable() {
    this.enabled = false;

    // Show player when exiting first-person mode
    this.showPlayer();

    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  hidePlayer() {
    // Store current player model visibility state
    this.originalVisibility = [];
    this.player.traverse(child => {
      if (child.isMesh) {
        this.originalVisibility.push({
          object: child,
          visible: child.visible
        });
        child.visible = false;
      }
    });
  }

  showPlayer() {
    // Restore player model visibility
    if (this.originalVisibility) {
      this.originalVisibility.forEach(item => {
        item.object.visible = item.visible;
      });
      this.originalVisibility = null;
    }
  }

  update() {
    if (!this.enabled) return 0;

    // Set player rotation to match camera's horizontal rotation
    this.player.rotation.y = this.rotationY;

    // Position camera at player eye height
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + this.eyeHeight;
    this.camera.position.z = this.player.position.z;

    // Set camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.x = this.rotationX;
    this.camera.rotation.y = this.rotationY;

    return this.rotationY;
  }
}

export { PlayerController, ThirdPersonCameraController, FirstPersonCameraController };