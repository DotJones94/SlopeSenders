/** @type {import('../types/categories').Category[]} */
export const baseCategories = [
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
        header: 'The most',
        title: 'Improved',
        description: 'The person who has improved the most this season',
        image: 'improved.png',
      },
      {
        header: 'The best',
        title: 'Frequent Flyer',
        description: 'The person who nailed that air, but maybe not the landing',
        image: 'faller.png',
      },
      {
        header: 'The best',
        title: 'Wingman',
        description:
          'The person who has helped a fellow sender out, the would not be where they are today without them',
        image: 'wing-man.png',
      },
      {
        header: 'The best',
        title: 'Walk of shame',
        description:
          'The person who has delighted the morning runners in the same clothes as the night before',
        image: 'shame.png',
      },
      {
        header: 'The best',
        title: 'Bills Cager',
        description:
          'The person who has seen more of the cage than the slopes, and the people want to see more',
        image: 'cager.png',
      },
      {
        header: 'The best',
        title: 'Gear Slut',
        description: 'The person who is a sucker for all the gear, no idea',
        image: 'gliter-suit.png',
      },
      {
        header: 'The best',
        title: 'Risk Management',
        description:
          'The person who is NOT going to risk it for the biscuit, who is going to have a good time for a long time',
        image: 'risk.png',
      },
      {
        header: 'The best',
        title: 'Banter',
        description:
          'The person who you want to join on the car ride up and you know there will be belly laughs the whole way',
        image: 'apres-athlete.png',
      },
      {
        header: 'The best',
        title: 'Après Participation with Limited Durability',
        description:
          'The person who is always there to start the party but will be the first one in bed',
        image: 'bailer.png',
      },
      {
        header: 'The best',
        title: 'Worse-for-Wear',
        description: 'The person who has been on the hill and probably should have stayed in bed',
        image: 'worse.png',
      },
    ],
  },
  {
    id: 'predictions',
    title: 'Kangaroo Court',
    blurb:
      'Add in some of the biggest mountain icks you have seen this season that need to be mentioned and the defendant will need speak for themselves, or go straight to JAIL',
    tiles: [],
  },
]
