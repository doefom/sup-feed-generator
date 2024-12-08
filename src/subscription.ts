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
  const hashtags = [
    '#sup',
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

  return text.toLowerCase().split(/\s+/).some(word => {
    return hashtags.includes(word)
  })
}