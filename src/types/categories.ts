export type Tile = {
  header: string
  title: string
  description: string
  image?: string
}

export type Category = {
  id: string
  title: string
  blurb: string
  tiles: Tile[]
}

export type LoopedTile = Tile & {
  loopKey: string
}

export type CategoryWithLoop = Category & {
  loopedTiles: LoopedTile[]
}
