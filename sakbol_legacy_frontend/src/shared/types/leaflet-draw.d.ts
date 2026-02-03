declare module "leaflet" {
  namespace Draw {
    class Feature extends L.Handler {}
    class Polygon extends L.Draw.Polygon {}
    class Toolbar extends L.Draw.Toolbar {}
    class Event extends L.Draw.Event {}
  }

  namespace DrawEvents {
    const CREATED: string;
  }
}

declare module "leaflet-draw";