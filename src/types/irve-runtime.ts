import type { QualichargeEVSEConsolidated } from "@/types/irve";

export type IRVERow = QualichargeEVSEConsolidated;

export type WorkerStatus = "idle" | "loading" | "done" | "error";

export interface WorkerLoadMessage {
  type: "loading";
  message: string;
}

export interface WorkerChunkMessage {
  type: "chunk";
  points: IRVEPointFeature[];
  total: number;
  batchSize: number;
}

export interface WorkerDoneMessage {
  type: "done";
  total: number;
}

export interface WorkerErrorMessage {
  type: "error";
  message: string;
}

export interface IRVEPointProperties {
  cluster: false;
  id: number;
  row: IRVERow;
}

export interface IRVEPointFeature {
  type: "Feature";
  id: number;
  properties: IRVEPointProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

export type IRVEClusterFeature = {
  type: "Feature";
  id?: number | string;
  properties: {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type IRVEClusterOrPoint = IRVEClusterFeature | IRVEPointFeature;

export type WorkerMessage =
  | WorkerLoadMessage
  | WorkerChunkMessage
  | WorkerDoneMessage
  | WorkerErrorMessage;

export interface LoadState {
  status: WorkerStatus;
  loaded: number;
  total: number;
  message?: string;
  error?: string;
}
