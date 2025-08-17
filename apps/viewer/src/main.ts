import * as THREE from "three";

const container = document.getElementById("app") as HTMLDivElement;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);

// Placeholder "terrain"
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10, 64, 64),
  new THREE.MeshStandardMaterial({
    color: 0x88aa66,
    roughness: 1.0,
    metalness: 0.0,
  })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

const clock = new THREE.Clock();

let style: "realistic" | "atlas" = "realistic";
const styleName = document.getElementById("styleName")!;
const styleToggle = document.getElementById("styleToggle")!;

styleToggle.addEventListener("click", () => {
  style = style === "realistic" ? "atlas" : "realistic";
  styleName.textContent = style;
  if (style === "atlas") {
    (plane.material as THREE.MeshStandardMaterial).color.set(0xdbc39a); // parchment-ish
    scene.background = new THREE.Color(0xf0e6d2);
  } else {
    (plane.material as THREE.MeshStandardMaterial).color.set(0x88aa66);
    scene.background = new THREE.Color(0x87ceeb);
  }
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onResize);

function animate() {
  const t = clock.getElapsedTime();
  plane.rotation.z = Math.sin(t * 0.1) * 0.02; // tiny motion to show liveness
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
