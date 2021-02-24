import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, MuiAlert } from '@material-ui/lab/';

export default function TimeLine(props) {
  return <Timeline align='alternate'>
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color={props.timeLineColor1} />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>動画解析中</TimelineContent>
    </TimelineItem>
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color={props.timeLineColor2} />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>ポーズ解析中</TimelineContent>
    </TimelineItem>
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot color={props.timeLineColor3} />
      </TimelineSeparator>
      <TimelineContent>動画再エンコード中</TimelineContent>
    </TimelineItem>
  </Timeline>;
}