import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const postsToCreate = ops.posts.creates
      .filter((create) => isSupPost(create.record.text))
      .map((create) => {
        // map sup-related posts to a db row
        return {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}

function isSupPost(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/)

  // ------------------------------------------------------------------------
  // Check for strong hashtags
  // ------------------------------------------------------------------------

  const strongHashtags = [
    '#standuppaddle',
    '#standuppaddleboard',
    '#standuppaddling',
    '#standuppaddleboarding',
    '#paddleboarding',
    '#suplife',
    '#supadventure',
    '#supboarding',
    '#supaddict',
    '#supfun',
    '#suparoundtheworld',
    '#suptravel',
    '#supdestinations',
    '#paddleparadise',
    '#supandexplore',
    '#supgermany',
    '#supadventuretime',
    '#supnature',
    '#supsunset',
    '#supocean',
    '#supfitness',
    '#supyoga',
    '#supsurf',
    '#supracing',
    '#supfishing',
    '#supcamping',
    '#suphiking',
    '#suptouring',
    '#supgear',
    '#supboard',
    '#inflatablesup',
    '#isup',
    '#suppaddle',
    '#paddleboardgear',
    '#supaccessories',
    '#supfornature',
    '#paddlelove',
    '#supcommunity',
    '#supvibes',
    '#supaddiction',
    '#supfamily',
    '#paddletogether',
    '#wintersup',
    '#autumnsup',
    '#summersup',
    '#springsup',
    '#coldwatersup',
    '#supmoments',
    '#paddleadventure',
    '#supandsmile',
    '#supgoals',
    '#supalps',
    '#riversup',
    '#lakesup',
    '#beachsup',
    '#oceansup'
  ];
  const hasStrongHashtag = words.some(word => {
    return strongHashtags.includes(word)
  })

  if (hasStrongHashtag) {
    return true;
  }

  // ------------------------------------------------------------------------
  // Check for weak hashtags.
  //
  // If a weak hashtag is found, the post should also contain sup related
  // words (not necessarily hashtags) to be considered a sup post.
  //
  // Note: 'sup' is commonly used as "What's up?" and should not be considered
  // stand up paddling. Therefore, we only consider 'sup' as a weak hashtag
  // and require additional sup related words to be present in the post.
  // ------------------------------------------------------------------------

  const weakHashtags = ['#sup'];
  const supWords = ['stand up', 'standup', 'paddle', 'paddling', 'board', 'paddel'];

  const hasWeakHashtag = words.some(word => {
    return weakHashtags.includes(word)
  })

  if (hasWeakHashtag) {
    const hasSupWord = words.some(word => {
      return supWords.includes(word)
    })

    if (hasSupWord) {
      return true;
    }
  }

  // ------------------------------------------------------------------------
  // No strong or weak hashtags found, return false.
  // ------------------------------------------------------------------------

  return false
}