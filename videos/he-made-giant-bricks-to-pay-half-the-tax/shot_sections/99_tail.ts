
DOF.splice(0, DOF.length, { f: 0, cInf: 0 }, ...dof.sort((a, b) => a.f - b.f));
