import type { Category, CategoryWithLoop } from '@/types/categories'

export const loopMultiplier = 3

export const baseCategories: Category[] = [
  {
    id: 'metrics',
    title: 'The Metrics',
    blurb: 'The numbers category. Most of these stats will come from the mountain apps.',
    tiles: [
      {
        header: 'The most',
        title: 'Vertical Meters',
        description: 'How far you went up and down, up and down, up and down, up and down... ',
        image: 'ruler.png',
      },
      {
        header: 'The most',
        title: 'Overall Runs',
        description:
          'Give a guess, no one is going to fight you on this one, on average we do like 9 runs a day',
        image: 'tired-skier.png',
      },
      {
        header: 'The most',
        title: 'Days on the Slopes',
        description: 'People will fight you on this one, we will be looking for read receipts',
        image: 'calendar.png',
      },
      {
        header: 'The most',
        title: 'Different Resorts',
        description: 'How many different mountains you flew down this season you legend',
        image: 'globe.png',
      },
      {
        header: 'The fastest',
        title: 'Top Speed',
        description:
          'The fastest km/h. Whooooosh, you speed demon, thank goodness patrol was not there',
        image: 'rocket.png',
      },
    ],
  },
  {
    id: 'bests',
    title: 'The Bests',
    blurb:
      'The best of the best. This will be by popular vote, so keep your eye out this season. Photo evidence mandatory. *Voting page coming soon*',
    tiles: [
      {
        header: 'The best',
        title: 'Dressed',
        description: 'The person who has looked the best on the slopes',
        image: 'gliter-suit.png',
      },
      {
        header: 'The best',
        title: 'Packed Lunch',
        description: 'The person who has displayed quality high altitude lunching skills',
        image: 'frozen-sandwich.png',
      },
      {
        header: 'The best',
        title: 'Trickster',
        description: 'The person who has wowed the crowd the most',
        image: 'trickster.png',
      },
      {
        header: 'The best',
        title: 'Apres Athlete',
        description: 'The person who owns the bar on the mountain, it is not light work',
        image: 'apres-athlete.png',
      },
      {
        header: 'The best',
        title: 'Faller',
        description: 'The person who has eaten more snow than they have skied',
        image: 'faller.png',
      },
    ],
  },
  {
    id: 'predictions',
    title: 'The Predictions',
    blurb:
      'The fortune tellers. Get your bets in, obviously there will be prizes. *Betting page coming soon*',
    tiles: [
      {
        header: 'Most likely to',
        title: 'Hit a Tree',
        description: 'The person who uses physical objects to stop',
        image: 'tree-sender.png',
      },
      {
        header: 'Most likely to',
        title: 'Improve',
        description: 'The person who went from shame to fame',
        image: 'improved.png',
      },
      {
        header: 'Most likely to',
        title: 'Damage Equipment',
        description: 'The person who does not care for their gear',
        image: 'gear-fail.png',
      },
      {
        header: 'Most likely to',
        title: 'Bail',
        description: 'The person who has bailed the most',
        image: 'bailer.png',
      },
    ],
  },
]

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const categories: CategoryWithLoop[] = baseCategories.map((category) => {
  const looped = Array.from({ length: loopMultiplier }, (_, loopIndex) =>
    category.tiles.map((tile, tileIndex) => ({
      ...tile,
      slug: `${slugify(category.id)}-${slugify(tile.title)}`,
      loopKey: `${category.id}-${loopIndex}-${tileIndex}`,
    })),
  ).flat()

  return { ...category, loopedTiles: looped }
})
