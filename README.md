# Three.js Third-Person Character Controller

Based on SimonDev's [Quick 3D RPG Tutorial](https://github.com/simondevyoutube/Quick_3D_RPG)

## Features

- ✅ Entity Component System (ECS) architecture
- ✅ Third-person camera with smooth following (lerp)
- ✅ WASD character movement controls
- ✅ Character rotation with A/D keys
- ✅ Sprint mode with Shift key
- ✅ Simple box character mesh
- ✅ Ground plane with grid helper

## Architecture

### Entity Component System
The project uses an ECS architecture where:
- **Entities** are containers for components
- **Components** contain logic and data
- **EntityManager** manages all entities and their updates

### Key Files

- **entity.js** - Base Entity and Component classes
- **entity-manager.js** - Manages all entities in the scene
- **player-entity.js** - Character controller component
- **player-input.js** - Keyboard input handling component
- **third-person-camera.js** - Camera follow component
- **main.js** - Scene setup and game loop

## Controls

- **W** - Move forward
- **S** - Move backward
- **A** - Turn left
- **D** - Turn right
- **Shift** - Sprint (hold while moving)

## How It Works

1. **Entity Manager** creates and manages the player entity
2. **Player Input Component** tracks keyboard state
3. **Character Controller Component** handles movement and rotation based on input
4. **Third-Person Camera Component** smoothly follows the character using lerp
5. All components update each frame through the entity manager

## Running the Project

Since the project uses ES modules, you need to run it through a local server:

### Using Python:
```bash
python -m http.server 8000
```

### Using Node.js:
```bash
npx serve
```

Then open `http://localhost:8000` in your browser.

## Camera System

The third-person camera:
- Positions itself 15 units behind and 10 units above the character
- Smoothly lerps to follow the character's movement
- Uses quaternion rotation from the character entity
- Applies a damping factor for smooth camera motion

## Movement System

The character controller:
- Uses velocity-based movement with acceleration and deceleration
- Forward/backward movement (W/S keys)
- Rotation on the Y-axis (A/D keys)
- Sprint modifier with Shift key (2x speed)
- Smooth deceleration when keys are released

## Future Enhancements

Possible additions based on the full tutorial:
- Character animations with FBX models
- State machine for animation states (idle, walk, run, attack)
- Health system
- Collision detection
- NPC entities
- Quest system
- UI overlay
