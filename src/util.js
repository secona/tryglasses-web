export function parseOBJ(text) {
  const positions = [];
  const texCoords = [];
  const vertices = [];
  const uvs = [];
  const faces = [];

  for (const line of text.split("\n")) {
    const parts = line.trim().split(" ");
    const type = parts.shift();
    
    if (type === "v") {
      vertices.push(parts.map(parseFloat));
    } else if (type === "vt") {
      uvs.push(parts.map(parseFloat));
    } else if (type === "f") {
      const currentFace = parts.map((p) => {
        const [vIndex, vtIndex] = p.split("/");
        return [
           parseInt(vIndex, 10) - 1, 
           vtIndex ? parseInt(vtIndex, 10) - 1 : 0
        ];
      });

      for (let i = 1; i < currentFace.length - 1; i++) {
        faces.push([currentFace[0], currentFace[i], currentFace[i + 1]]);
      }
    }
  }

  for (const f of faces) {
    for (const [vi, vti] of f) {
      if (vertices[vi]) {
        positions.push(...vertices[vi]);
        if (uvs[vti]) {
            texCoords.push(...uvs[vti]);
        } else {
            texCoords.push(0, 0);
        }
      }
    }
  }

  return { positions, texCoords };
}
