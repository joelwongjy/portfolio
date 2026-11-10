import * as THREE from "three";

// A camera cutaway shared by everything that can stand between the camera
// and the car (buildings, hillside, trees, the tunnel cover): fragments
// inside a cone around the sight line, above the car, are cut away cleanly,
// with a darker rim where the cut passes through — like a section drawing.
export const cutaway = {
  uCutCar: { value: new THREE.Vector3() },
  uCutCam: { value: new THREE.Vector3() },
  uCutR: { value: new THREE.Vector2(7, 12) },
  uCutOn: { value: 1 },
};

export const withCutaway = <T extends THREE.Material>(material: T): T => {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    Object.assign(shader.uniforms, cutaway);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCutWorld;")
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec4 cutW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          cutW = instanceMatrix * cutW;
        #endif
        vCutWorld = (modelMatrix * cutW).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vCutWorld;
        uniform vec3 uCutCar;
        uniform vec3 uCutCam;
        uniform vec2 uCutR;
        uniform float uCutOn;
        float cutRim = 0.0;`
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        if (uCutOn > 0.0 && vCutWorld.y > uCutCar.y + 1.2) {
          vec3 cd = uCutCar - uCutCam;
          float L = length(cd);
          vec3 dir = cd / L;
          float t = dot(vCutWorld - uCutCam, dir);
          if (t > 0.0 && t < L - 3.0) {
            float r = mix(uCutR.y, uCutR.x, t / L) * uCutOn;
            float d = length(vCutWorld - (uCutCam + dir * t));
            if (d < r) discard;
            cutRim = 1.0 - smoothstep(r, r + 0.7, d);
          }
        }`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb *= 1.0 - 0.28 * cutRim;`
      );
  };
  // keep one compiled program per material flavour
  const key = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => (key ? key() : "") + "|cutaway";
  return material;
};
