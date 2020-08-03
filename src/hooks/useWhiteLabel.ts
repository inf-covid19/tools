import { useMemo } from "react";
import { WHITE_LABEL_ID } from "../constants";
import SoledadeRS from "../whitelabels/Brazil.regions.RS:Soledade.json";
import { MetadataRegion } from "./useMetadata";

type WhiteLabelSpec = {
  title: string;
  subtitle: string;
  metadata: MetadataRegion;
  defaultRegion: string;
  defaultRegions: string[];
  defaultSimilarityAspect?: string;
  logo: { src: string; alt: string };
  sources: { name: string; url: string }[];
};

const WHITE_LABELS: Record<string, WhiteLabelSpec> = {
  "Brazil.regions.RS:Soledade": SoledadeRS,
};

export default function useWhiteLabel() {
  return useMemo(() => {
    const spec = WHITE_LABELS[WHITE_LABEL_ID];

    return {
      ...spec,
      enabled: !!spec,
    };
  }, []);
}
