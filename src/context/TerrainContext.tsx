import React, { createContext, useContext, useState } from "react";

interface TerrainContextType {
  terrainId: number | null;
  setTerrainId: (id: number | null) => void;
}

const TerrainContext = createContext<TerrainContextType>({
  terrainId: null,
  setTerrainId: () => {},
});

export const useTerrain = () => useContext(TerrainContext);

export const TerrainProvider = ({ children }) => {
  const [terrainId, setTerrainId] = useState<number | null>(null);

  return (
    <TerrainContext.Provider value={{ terrainId, setTerrainId }}>
      {children}
    </TerrainContext.Provider>
  );
};