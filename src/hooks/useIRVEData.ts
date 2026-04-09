"use client";

import { useEffect, useRef, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import type { IRVEPointFeature, LoadState, WorkerMessage } from "@/types/irve-runtime";

export interface UseIRVEDataResult {
  points: IRVEPointFeature[];
  loadState: LoadState;
}

const PROGRESS_UPDATE_INTERVAL_MS = 200;

function clonePoints(source: IRVEPointFeature[]) {
  const copy = new Array<IRVEPointFeature>(source.length);
  for (let i = 0; i < source.length; i += 1) {
    copy[i] = source[i];
  }
  return copy;
}

export function useIRVEData(): UseIRVEDataResult {
  const [points, setPoints] = useState<IRVEPointFeature[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    loaded: 0,
    total: 0,
    message: "Fetching Parquet...",
  });

  const workerRef = useRef<Worker | null>(null);
  const pointsRef = useRef<IRVEPointFeature[]>([]);
  const lastProgressUpdateRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker(withBasePath("/worker/dataset-parser.worker.js"));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === "loading") {
        setLoadState((prev) => ({
          ...prev,
          status: "loading",
          message: message.message,
        }));
        return;
      }

      if (message.type === "chunk") {
        const nextPoints = pointsRef.current;
        for (let i = 0; i < message.points.length; i += 1) {
          nextPoints.push(message.points[i]);
        }

        const now = Date.now();
        if (now - lastProgressUpdateRef.current >= PROGRESS_UPDATE_INTERVAL_MS) {
          lastProgressUpdateRef.current = now;
            setLoadState((prev) => ({
              ...prev,
              status: "loading",
              loaded: message.total,
              total: message.total,
              message: "Parsing Parquet...",
            }));
          }

        return;
      }

      if (message.type === "done") {
        setPoints(clonePoints(pointsRef.current));
        setLoadState({
          status: "done",
          loaded: message.total,
          total: message.total,
        });
        return;
      }

      if (message.type === "error") {
        setLoadState((prev) => ({
          ...prev,
          status: "error",
          error: message.message,
        }));
      }
    };

    worker.onerror = (event) => {
      setLoadState((prev) => ({
        ...prev,
        status: "error",
        error: event.message,
      }));
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      pointsRef.current = [];
      lastProgressUpdateRef.current = 0;
    };
  }, []);

  return { points, loadState };
}
