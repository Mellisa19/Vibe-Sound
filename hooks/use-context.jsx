"use client";
import { createContext, useContext } from "react";
export const MusicContext = createContext(null);
export const NextContext = createContext(null);
export const TasteContext = createContext(null);

export const useMusicProvider = () => useContext(MusicContext);
export const useNextMusicProvider = () => useContext(NextContext);
export const useTaste = () => useContext(TasteContext);
