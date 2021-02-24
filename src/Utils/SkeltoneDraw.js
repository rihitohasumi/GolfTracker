export const skeltoneDraw = (ctx, data, imgWidth, imgHeight) => {
  ctx.clearRect(0, 0, imgWidth, imgHeight);
  ctx.lineWidth = 3;
  // 肩
  ctx.strokeStyle = '#191970';
  ctx.beginPath();
  ctx.moveTo(data[5].position.x, data[5].position.y);
  ctx.lineTo(data[6].position.x, data[6].position.y);
  ctx.stroke();

  // 右腕
  ctx.strokeStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(data[6].position.x, data[6].position.y);
  ctx.lineTo(data[8].position.x, data[8].position.y);
  ctx.lineTo(data[10].position.x, data[10].position.y);
  ctx.stroke();

  // 左腕
  ctx.strokeStyle = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(data[5].position.x, data[5].position.y);
  ctx.lineTo(data[7].position.x, data[7].position.y);
  ctx.lineTo(data[9].position.x, data[9].position.y);
  ctx.stroke();

  // 上半身下半身
  ctx.strokeStyle = '#7cfc00';
  ctx.beginPath();
  ctx.moveTo(data[5].position.x, data[5].position.y);
  ctx.lineTo(data[11].position.x, data[11].position.y);
  ctx.stroke();
  ctx.strokeStyle = '#7cfc00';
  ctx.beginPath();
  ctx.moveTo(data[6].position.x, data[6].position.y);
  ctx.lineTo(data[12].position.x, data[12].position.y);
  ctx.stroke();

  // ヒップ
  ctx.strokeStyle = '#3cb371';
  ctx.beginPath();
  ctx.moveTo(data[11].position.x, data[11].position.y);
  ctx.lineTo(data[12].position.x, data[12].position.y);
  ctx.stroke();

  // 右足
  ctx.strokeStyle = '#ff7f50';
  ctx.beginPath();
  ctx.moveTo(data[12].position.x, data[12].position.y);
  ctx.lineTo(data[14].position.x, data[14].position.y);
  ctx.lineTo(data[16].position.x, data[16].position.y);
  ctx.stroke();

  // 左足
  ctx.strokeStyle = '#f0e68c';
  ctx.beginPath();
  ctx.moveTo(data[11].position.x, data[11].position.y);
  ctx.lineTo(data[13].position.x, data[13].position.y);
  ctx.lineTo(data[15].position.x, data[15].position.y);
  ctx.stroke();
};