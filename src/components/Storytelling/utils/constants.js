import * as d3 from "d3";
export const defaultPolicies = ["stay_home_restrictions", "workplace_closing", "school_closing"];
export const MeasuresConfig = {
  school_closing: {
    id: "school_closing",
    name: "School Closing",
    indicators: {
      0: "no measures",
      1: "recommend closing or all schools open with alterations resulting in significant differences compared to non-Covid-19 operations",
      2: "require closing (only some levels or categories, eg just high school, or just public schools)",
      3: "require closing all levels",
    },
    colorSchema: (n) => d3.interpolateBuPu(Math.abs(n) / 3),
  },
  workplace_closing: {
    id: "workplace_closing",
    name: "Workplace Closing",
    indicators: {
      0: "no measures",
      1: "recommend closing (or recommend work from home) or all businesses open with alterations resulting in significant differences compared to non-Covid-19 operation",
      2: "require closing (or work from home) for some sectors or categories of workers",
      3: "require closing (or work from home) for all-but-essential workplaces (eg grocery stores, doctors)",
    },
    colorSchema: (n) => d3.interpolateOrRd(Math.abs(n) / 3),
  },
  cancel_events: {
    id: "cancel_events",
    name: "Cancel Events",
    indicators: {
      0: "no measures",
      1: "recommend cancelling",
      2: "require cancelling",
    },
  },
  gatherings_restrictions: {
    id: "gatherings_restrictions",
    name: "Gatherings Restrictions",
    indicators: {
      0: "no restrictions",
      1: "restrictions on very large gatherings (the limit is above 1000 people)",
      2: "restrictions on gatherings between 101-1000 people",
      3: "restrictions on gatherings between 11-100 people",
      4: "restrictions on gatherings of 10 people or less",
    },
  },
  transport_closing: {
    id: "transport_closing",
    name: "Transport Closing",
    indicators: {
      0: "no measures",
      1: "recommend closing (or significantly reduce volume/route/means of transport available)",
      2: "require closing (or prohibit most citizens from using it)",
    },
  },
  stay_home_restrictions: {
    id: "stay_home_restrictions",
    name: "Stay Home Restrictions",
    indicators: {
      0: "no measures",
      1: "recommend not leaving house",
      2: "require not leaving house with exceptions for daily exercise, grocery shopping, and ‘essential’ trips",
      3: "require not leaving house with minimal exceptions (eg allowed to leave once a week, or only one person can leave at a time, etc)",
    },
    colorSchema: (n) => d3.interpolateYlGn(Math.abs(n) / 3),
  },
  internal_movement_restrictions: {
    id: "internal_movement_restrictions",
    name: "Internal Movement Restrictions",
    indicators: {
      0: "no measures",
      1: "recommend not to travel between regions/cities",
      2: "internal movement restrictions in place",
    },
  },
  international_movement_restrictions: {
    id: "international_movement_restrictions",
    name: "International Movement Restrictions",
    indicators: {
      0: "no restrictions",
      1: "screening arrivals",
      2: "quarantine arrivals from some or all regions",
      3: "ban arrivals from some regions",
      4: "ban on all regions or total border closure",
    },
  },
  information_campaigns: {
    id: "information_campaigns",
    name: "Information Campaigns",
    indicators: {
      0: "no Covid-19 public information campaign",
      1: "public officials urging caution about Covid-19",
      2: "coordinated public information campaign (eg across traditional and social media)",
    },
  },
  testing_policy: {
    id: "testing_policy",
    name: "Testing Policy",
    indicators: {
      0: "no testing policy",
      1: "only those who both (a) have symptoms AND (b) meet specific criteria (eg key workers, admitted to hospital, came into contact with a known case, returned from overseas)",
      2: "testing of anyone showing Covid-19 symptoms",
      3: "open public testing (eg “drive through” testing available to asymptomatic people)",
    },
  },
  contact_tracing: {
    id: "contact_tracing",
    name: "Contact Tracing",
    indicators: {
      0: "no contact tracing",
      1: "limited contact tracing; not done for all cases",
      2: "comprehensive contact tracing; done for all identified cases",
    },
  },
  // TODO:
  // facial_coverings
  // vaccination_policy
  // elderly_people_protection
};
