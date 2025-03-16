import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Event } from './event.entity';

@EventSubscriber()
export class EventSubscribe implements EntitySubscriberInterface<Event> {
  constructor(datasource: DataSource) {
    datasource.subscribers.push(this);
  }

  listenTo() {
    return Event;
  }

  async afterInsert(event: InsertEvent<Event>): Promise<void> {
    await event.manager.update('event', event.entityId, {
      url: `${process.env.APP_HOST}:${process.env.APP_PORT}/events/${event.entityId}`,
    });
  }
}
