import React from 'react';
import moment from 'moment';
import groupBy from 'lodash.groupby';
import sortBy from 'lodash.sortby';
import { eventHasValidLocation } from './Util';
require('twix');


const MAX_DAYS_IN_LIST = 4;

function EventTimes(props) {
  const { rawTimes } = props;
  let sortedTimesByDate = groupBy(sortBy(rawTimes,
    // Sort all of the ranges by when they start;
    // Unix returns the millisecond time, so all
    // events will be different
    (item) => { return item.start.unix() }),
    // Group the ranges by the day they happen on;
    // fully including the year, month, and day
    // in that order guarantees that normal sorting
    // will respect 9/31 v 10/1, and 2020/01 vs 2019/12
    (item) => { return item.start.format('YYYY-MM-DD') }
  )

  let sortedDates = Object.keys(sortedTimesByDate).sort();

  const dateRowFactory = (date) => {
    let times = sortedTimesByDate[date];
    let dayStr = times[0].start.format('ddd M/D')
    let timeStrs = times.map((time) => time.range.format({ hideDate : true })).join(', ')
    return (
      <p key={`time-${date}`}>
        { dayStr }{' | '}{ timeStrs }
      </p>
    )
  }

  if (sortedDates.length <= MAX_DAYS_IN_LIST) {
    return sortedDates.map(dateRowFactory)
  } else {
    let nextDay = sortedDates[MAX_DAYS_IN_LIST - 1];
    let lastDay = sortedDates[sortedDates.length - 1];
    let nextStart = sortedTimesByDate[nextDay][0].start;
    let lastStart = sortedTimesByDate[lastDay][0].start;
    return sortedDates.slice(0,MAX_DAYS_IN_LIST - 1).map(dateRowFactory).concat(
      <p>
        More Times from {nextStart.twix(lastStart, { allDay : true }).format()}
      </p>
    )
  }
}

/*
 *
 * ??? frm: DELETE this once I have verified that Util().eventHasValidLocation() works
 *
function eventHasValidLocation(event) {
  // Utility function to avoid repeating this logic...
  return ('location' in event && 'location' in event['location'] && 'latitude' in event['location']['location']);
}
 *
 */

export function EventList(props) {
  let listEvents;
  if(props.events.length > 0){
  listEvents = props.events.map((event) => {

    // Normalize Mobilize's time formatting into
    // easy-to-use moments
    let rawTimes = event['timeslots'].map((timeslot) => {
      let start = moment(timeslot.start_date * 1000);
      let end = moment(timeslot.end_date * 1000);
      return {
        start, end,
        range: start.twix(end)
      }
    })

    //Location filter
    if(props.locFilt != null){
      if(eventHasValidLocation(event)) {
        if(event['location']['location']['latitude'] !== props.locFilt['lat'] || event['location']['location']['longitude'] !== props.locFilt['lng']){
          return(null);
        }
      } else {
        return(null);
      }
    }

    // ??? frm: React is complaining about there not being a unique key.  Here is the warning:
    //              Each child in a list should have a unique "key" prop
    //          I am assuming that it is the <li> list below that should have a key...
    //          However, the issue seems benign - not seeing any crashes or other odd behavior because of it...
    //          I added a key to the <li> element, but that did not solve the problem.
    //          Note that you get the warning (in the console) for zip: 02144, but not for zip: 44106 which
    //          makes me believe the lists are somehow different.  Note also that the event-id keys appear
    //          to be unique...

    return (
      <a href={event['browser_url']}
        className="eventCard"
        target="_blank"
        rel="noopener"
        key={event['id']}
        coord={
          eventHasValidLocation(event) ?
          "" + event['location']['location']['latitude'] + "&" + event['location']['location']['longitude'] :
          ""}
        onMouseEnter={(event) => { props.updatedHover(event['currentTarget'].getAttribute('coord')) }}
        onMouseLeave={(event) => { props.updatedHover(null) }}>
        <li key={event['id'].toString()}>
          <div>
            <h3>{event['title']}</h3>
            <p><strong>{event['location']['venue']}</strong> in <strong>{event['location']['locality']}</strong></p>
            <EventTimes rawTimes={rawTimes} />
            <p className="eventRSVP">Click to RSVP</p>
          </div>
        </li>
      </a>

    )
  });
} else {
  listEvents = null;
}

  // frm: At this point listEvents is either null or the HTML for a list of each of the events

  return (
    <ul className="eventList">{listEvents}
    <div className="kicker">
        <h4>Don't see an event near you?</h4>
        <p><a href="https://events.elizabethwarren.com/?is_virtual=true">Join a virtual event</a> or <a href="https://events.elizabethwarren.com/event/create/">Host your own</a></p>
    </div>
    </ul>
  );

}

export default EventList;
