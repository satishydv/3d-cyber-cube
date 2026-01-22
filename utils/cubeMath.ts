import * as THREE from 'three';

/**
 * CUBE MATHEMATICS AND ROTATION UTILITIES
 * 
 * This module handles the core mathematical operations for the 3D Rubik's Cube.
 * It manages piece positions, color assignments, and rotation transformations.
 */

/**
 * INITIAL_POSITIONS: The 27 cube pieces in their solved state
 * 
 * A Rubik's Cube consists of 27 smaller cubes (3x3x3):
 * - 1 center piece (hidden, at origin)
 * - 6 center pieces (one on each face)
 * - 12 edge pieces (between two faces)
 * - 8 corner pieces (between three faces)
 * 
 * Each position is represented as a Vector3 with coordinates in the range [-1, 0, 1].
 * For example:
 * - (1, 1, 1) is the top-right-front corner
 * - (0, 1, 0) is the center of the top face
 * - (0, 0, 0) is the hidden center piece
 */
export const INITIAL_POSITIONS: THREE.Vector3[] = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      INITIAL_POSITIONS.push(new THREE.Vector3(x, y, z));
    }
  }
}

/**
 * COLORS: Official WCA (World Cube Association) Standard Color Scheme
 * 
 * These are the internationally standardized colors for speedcubing competitions:
 * - U (Up/Top): White
 * - D (Down/Bottom): Yellow (opposite of white)
 * - F (Front): Green
 * - B (Back): Blue (opposite of green)
 * - R (Right): Red
 * - L (Left): Orange (opposite of red)
 * - CORE: Black (for internal faces not visible on the surface)
 */
export const COLORS = {
  U: '#FFFFFF', // Up - White
  D: '#FFD500', // Down - Yellow
  F: '#009E60', // Front - Green
  B: '#0051BA', // Back - Blue
  R: '#C41E3A', // Right - Red
  L: '#FF5800', // Left - Orange
  CORE: '#000000' // Core - Pure Black Plastic
};

/**
 * getFaceColors: Determines which colors appear on each face of a cube piece
 * 
 * Given a position (x, y, z), this function returns the color for each face of that piece.
 * Only external faces (on the surface of the cube) have colors; internal faces are black.
 * 
 * Logic:
 * - If x === 1, the piece is on the right face → right side gets RED
 * - If x === -1, the piece is on the left face → left side gets ORANGE
 * - Similar logic for y (up/down) and z (front/back)
 * - Internal faces (not on the surface) get CORE (black)
 * 
 * Example:
 * - Position (1, 1, 1) is a corner piece with Red, White, and Green visible
 * - Position (0, 0, 0) is the center piece with all faces black
 * 
 * @param x - X coordinate (-1, 0, or 1)
 * @param y - Y coordinate (-1, 0, or 1)
 * @param z - Z coordinate (-1, 0, or 1)
 * @returns Object with color for each face (right, left, up, down, front, back)
 */
export const getFaceColors = (x: number, y: number, z: number) => {
  const faces = {
    right: x === 1 ? COLORS.R : COLORS.CORE,
    left: x === -1 ? COLORS.L : COLORS.CORE,
    up: y === 1 ? COLORS.U : COLORS.CORE,
    down: y === -1 ? COLORS.D : COLORS.CORE,
    front: z === 1 ? COLORS.F : COLORS.CORE,
    back: z === -1 ? COLORS.B : COLORS.CORE,
  };
  return faces;
};

/**
 * rotateVector: Rotates a 3D vector by 90 degrees around a specified axis
 * 
 * This is a specialized rotation function optimized for 90-degree increments,
 * which is all we need for Rubik's Cube rotations. It uses simplified integer
 * math instead of full rotation matrices since:
 * - sin(90°) = 1
 * - cos(90°) = 0
 * - This makes calculations exact with no floating-point errors
 * 
 * ROTATION MATHEMATICS:
 * Standard 3D rotation matrices for 90° around each axis:
 * 
 * Rotation around X-axis (pitch):
 * [1   0    0 ]   [x]   [x        ]
 * [0  cos -sin] × [y] = [y*0 - z*1] = [-z]
 * [0  sin  cos]   [z]   [y*1 + z*0] = [y ]
 * 
 * Rotation around Y-axis (yaw):
 * [ cos  0  sin]   [x]   [x*0 + z*1] = [z ]
 * [ 0    1   0 ] × [y] = [y        ] = [y ]
 * [-sin  0  cos]   [z]   [-x*1+ z*0] = [-x]
 * 
 * Rotation around Z-axis (roll):
 * [cos -sin  0]   [x]   [x*0 - y*1] = [-y]
 * [sin  cos  0] × [y] = [x*1 + y*0] = [x ]
 * [0    0    1]   [z]   [z        ] = [z ]
 * 
 * The `dir` parameter controls direction:
 * - dir = 1: clockwise (positive rotation)
 * - dir = -1: counter-clockwise (negative rotation)
 * 
 * @param vec - The vector to rotate (modified in place)
 * @param axis - Rotation axis: 'x', 'y', or 'z'
 * @param dir - Direction: 1 for clockwise, -1 for counter-clockwise
 */
export const rotateVector = (vec: THREE.Vector3, axis: string, dir: number) => {
    const x = vec.x;
    const y = vec.y;
    const z = vec.z;
    
    // Apply simplified 90-degree rotation matrices
    // sin(90°) = 1, cos(90°) = 0
    
    if (axis === 'x') {
        // Rotation around X-axis (affects Y and Z coordinates)
        // y' = y*0 - z*dir = -z*dir
        // z' = y*dir + z*0 = y*dir
        vec.y = -z * dir;
        vec.z = y * dir;
    } else if (axis === 'y') {
        // Rotation around Y-axis (affects X and Z coordinates)
        // x' = x*0 + z*dir = z*dir
        // z' = -x*dir + z*0 = -x*dir
        vec.x = z * dir;
        vec.z = -x * dir;
    } else if (axis === 'z') {
        // Rotation around Z-axis (affects X and Y coordinates)
        // x' = x*0 - y*dir = -y*dir
        // y' = x*dir + y*0 = x*dir
        vec.x = -y * dir;
        vec.y = x * dir;
    }
    
    // Round to nearest integer to avoid floating-point drift
    // After 90° rotations, all coordinates should be exactly -1, 0, or 1
    vec.round();
}

/**
 * getRotationData: Determines which axis and direction to rotate based on user input
 * 
 * This is one of the most complex functions in the codebase. It solves the problem:
 * "When a user drags on a cube face, which way should the cube rotate?"
 * 
 * THE PROBLEM:
 * - User clicks on a face with a specific normal vector (perpendicular to face)
 * - User drags in some direction on the 2D screen
 * - We need to convert this 2D screen drag into a 3D rotation axis and direction
 * 
 * THE ALGORITHM:
 * 
 * Step 1: Determine Valid Movement Axes
 * - A face with normal pointing in X direction can rotate around Y or Z axes
 * - A face with normal pointing in Y direction can rotate around X or Z axes  
 * - A face with normal pointing in Z direction can rotate around X or Y axes
 * - We identify two candidate axes perpendicular to the normal
 * 
 * Step 2: Project 3D Axes to 2D Screen Space
 * - Convert each candidate axis to screen coordinates
 * - This tells us "if we rotate around axis A, the drag would look like vector A' on screen"
 * 
 * Step 3: Match User Drag Direction to Best Axis
 * - Compare user's drag direction with each projected axis
 * - Use dot product to measure alignment
 * - Choose the axis that best matches the drag direction
 * 
 * Step 4: Calculate Rotation Axis and Direction
 * - Cross product: normal × moveAxis = rotation axis
 * - Determine if rotation should be positive or negative based on drag sign
 * - Account for axis orientation to ensure intuitive rotation direction
 * 
 * EXAMPLE:
 * - User clicks on front face (normal = [0, 0, 1])
 * - Valid move axes: X (horizontal) or Y (vertical)
 * - User drags right → rotate around Y-axis (vertical axis)
 * - User drags up → rotate around X-axis (horizontal axis)
 * 
 * @param normal - Normal vector of the clicked face (perpendicular to surface)
 * @param delta - 2D drag vector in screen space (pixels)
 * @param point - 3D point where user clicked on the cube
 * @param camera - Three.js camera (needed for 3D→2D projection)
 * @param size - Screen dimensions (width, height)
 * @returns Object with axis (as x/y/z components) and direction (±1)
 */
export const getRotationData = (
  normal: THREE.Vector3, 
  delta: THREE.Vector2, 
  point: THREE.Vector3, 
  camera: THREE.Camera, 
  size: { width: number, height: number }
) => {
  
  // Step 1: Identify which face was clicked and determine valid movement axes
  // We check which component of the normal is dominant
  const absX = Math.abs(normal.x);
  const absY = Math.abs(normal.y);
  
  let moveAxisA: THREE.Vector3, moveAxisB: THREE.Vector3;

  if (absX > 0.5) {
      // Clicked on left or right face (X-dominant normal)
      // Can rotate around Y (up/down) or Z (forward/back) axes
      moveAxisA = new THREE.Vector3(0, 1, 0); 
      moveAxisB = new THREE.Vector3(0, 0, 1);
  } else if (absY > 0.5) {
      // Clicked on top or bottom face (Y-dominant normal)
      // Can rotate around X (left/right) or Z (forward/back) axes
      moveAxisA = new THREE.Vector3(1, 0, 0); 
      moveAxisB = new THREE.Vector3(0, 0, 1);
  } else {
      // Clicked on front or back face (Z-dominant normal)
      // Can rotate around X (left/right) or Y (up/down) axes
      moveAxisA = new THREE.Vector3(1, 0, 0); 
      moveAxisB = new THREE.Vector3(0, 1, 0);
  }

  /**
   * Step 2: Project 3D movement axes onto 2D screen space
   * 
   * This helper function takes a 3D axis and converts it to a 2D screen direction.
   * It does this by:
   * 1. Creating a small line segment in 3D space along the axis
   * 2. Projecting both endpoints to screen coordinates
   * 3. Computing the resulting 2D vector
   * 
   * This tells us "if we move along this 3D axis, what direction would it appear
   * to move on the user's screen?"
   */
  const getScreenVector = (axis: THREE.Vector3) => {
      const pStart = point.clone();
      const pEnd = point.clone().add(axis.clone().multiplyScalar(0.5));
      pStart.project(camera);
      pEnd.project(camera);
      const dx = (pEnd.x - pStart.x) * (size.width / 2);
      const dy = -(pEnd.y - pStart.y) * (size.height / 2);
      return new THREE.Vector2(dx, dy).normalize();
  }

  // Get screen directions for both candidate axes
  const screenDirA = getScreenVector(moveAxisA);
  const screenDirB = getScreenVector(moveAxisB);
  
  // Step 3: Determine which axis best matches the user's drag direction
  // Normalize the drag vector and compare it with each projected axis
  const userDragDir = delta.clone().normalize();
  
  // Dot product measures alignment: 1 = same direction, -1 = opposite, 0 = perpendicular
  // We use abs() because we only care about alignment, not direction yet
  const alignmentA = Math.abs(userDragDir.dot(screenDirA));
  const alignmentB = Math.abs(userDragDir.dot(screenDirB));
  
  // Choose the axis with better alignment
  const bestMoveAxis = (alignmentA > alignmentB) ? moveAxisA : moveAxisB;
  const bestScreenDir = (alignmentA > alignmentB) ? screenDirA : screenDirB;
  
  // Step 4: Calculate the actual rotation axis using cross product
  // The rotation axis is perpendicular to both the face normal and the movement direction
  // Cross product gives us this perpendicular vector
  const rotAxis = new THREE.Vector3().crossVectors(normal, bestMoveAxis).normalize();
  
  // Determine if we should rotate positively or negatively
  // Sign of dot product tells us if drag is in same or opposite direction as screen projection
  const moveSign = Math.sign(userDragDir.dot(bestScreenDir));
  
  // Convert the rotation axis to a named axis (x, y, or z)
  let axisName = 'x';
  if (Math.abs(rotAxis.y) > 0.9) axisName = 'y';
  if (Math.abs(rotAxis.z) > 0.9) axisName = 'z';
  
  // Check if our computed rotation axis points in the positive or negative direction
  const basisVector = new THREE.Vector3();
  // @ts-ignore
  basisVector[axisName] = 1;
  const axisBasisSign = Math.sign(rotAxis.dot(basisVector));
  
  // Combine all direction factors to get final rotation direction
  const finalDirection = moveSign * axisBasisSign;

  return { 
      axis: { 
          x: axisName === 'x' ? 1 : 0, 
          y: axisName === 'y' ? 1 : 0, 
          z: axisName === 'z' ? 1 : 0 
      }, 
      direction: finalDirection 
  };
};