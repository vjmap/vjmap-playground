import { getMeshBoundingBox } from '@loaders.gl/schema';
import parseOBJ from './parse-obj';
import { getOBJSchema } from './get-obj-schema';
export default function loadOBJ(text, options) {
  const {
    meshes
  } = parseOBJ(text);
  const vertexCount = meshes.reduce((s, mesh) => s + mesh.header.vertexCount, 0);
  const attributes = mergeAttributes(meshes, vertexCount);
  const header = {
    vertexCount,
    boundingBox: getMeshBoundingBox(attributes)
  };
  const schema = getOBJSchema(attributes, {
    mode: 4,
    boundingBox: header.boundingBox
  });
  return {
    loaderData: {
      header: {}
    },
    schema,
    header,
    mode: 4,
    attributes
  };
}

function mergeAttributes(meshes, vertexCount) {
  const positions = new Float32Array(vertexCount * 3);
  let normals;
  let colors;
  let uvs;
  let i = 0;

  for (const mesh of meshes) {
    const {
      POSITION,
      NORMAL,
      COLOR_0,
      TEXCOORD_0
    } = mesh.attributes;
    positions.set(POSITION.value, i * 3);

    if (NORMAL) {
      normals = normals || new Float32Array(vertexCount * 3);
      normals.set(NORMAL.value, i * 3);
    }

    if (COLOR_0) {
      colors = colors || new Float32Array(vertexCount * 3);
      colors.set(COLOR_0.value, i * 3);
    }

    if (TEXCOORD_0) {
      uvs = uvs || new Float32Array(vertexCount * 2);
      uvs.set(TEXCOORD_0.value, i * 2);
    }

    i += POSITION.value.length / 3;
  }

  const attributes = {};
  attributes.POSITION = {
    value: positions,
    size: 3
  };

  if (normals) {
    attributes.NORMAL = {
      value: normals,
      size: 3
    };
  }

  if (colors) {
    attributes.COLOR_0 = {
      value: colors,
      size: 3
    };
  }

  if (uvs) {
    attributes.TEXCOORD_0 = {
      value: uvs,
      size: 2
    };
  }

  return attributes;
}
//# sourceMappingURL=load-obj.js.map