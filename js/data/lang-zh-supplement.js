/* 简体中文补充：真实界面中遗漏的短语与被 HTML 拆分的文本节点。 */
if (G.I18n.lang === 'zh-CN') G.I18n.add({
  // 登录与账号恢复说明被按钮、粗体标签拆分为独立文本节点。
  'Si vinculaste tu Gmail, pulsa': '如果已经绑定 Gmail，请点击',
  'con ese Gmail: es tu misma cuenta. Si no lo vinculaste, no se puede recuperar: crea una cuenta nueva (y esta vez vincula tu Gmail desde el aviso que sale al entrar).': '并使用绑定的 Gmail，即可登录原账号。若未绑定，则无法找回密码；请创建新账号，并在登录后的提示中绑定 Gmail。',
  'Vincula tu Gmail: si un día olvidas la contraseña, pulsas': '绑定 Gmail 后，即使忘记密码，也可以点击',
  'y es tu misma cuenta, con todo lo tuyo.': '登录原账号，保留全部游戏进度。',
  'desconocido': '未知错误',
  'No se pudo cargar {x}': '无法加载 {x}',

  // 图鉴与菜单。无后缀的按钮无法匹配要求非空占位符的原有词条。
  'Elegir de compañero': '选为伙伴',
  'Tienes su shiny': '已拥有这只宝可梦的异色形态',
  'Buscar por nombre': '输入宝可梦名称搜索',
  'Nº {x} · {x}': '编号 {x} · {x}',
  'Nº {x}': '编号 {x}',
  'Nv.{x}': '等级 {x}', 'Nv. {x}': '等级 {x}',
  '{x} Nv.{x}': '{x} 等级 {x}',
  'niveles': '级强化',
  'solicitud': '好友申请', 'solicitudes': '好友申请',
  'POKé SLOTS': '精灵扭蛋',
  'o': '或',

  // 任务倒计时、设置和费用中的动态片段。
  '{x} d {x} h': '{x} 天 {x} 小时',
  '{x} h {x} min': '{x} 小时 {x} 分钟',
  'la baja sola si el juego va a tirones (ahora: {x}).': '会在卡顿时自动降低画质（当前：{x}）。',
  '/ mes': '/ 月',

  // 社交与排行榜。
  'Ver su perfil': '查看玩家资料',
  'Solo': '单人',
  'Hoy': '今日', 'Semana': '本周', 'Mes': '本月',
  'en solitario con {x}': '使用{x}进行单人游戏',
  'en grupo con {x}': '使用{x}进行组队游戏',
  'Aún no estás en el top 50 {x}. Tu puesto exacto está en Histórico.': '你尚未进入前 50 名（{x}）。可在总榜查看准确排名。',

  // 排行榜管理界面。
  'Moderación': '排行榜管理', 'Reportes': '举报记录', 'Baneados': '已封禁',
  'Quitar marcas de más de 1 hora': '移除超过 1 小时的成绩',
  '¿Quitar del ranking TODAS las marcas de más de 1 hora (todas las tablas)? No se puede deshacer.': '确定从所有排行榜中移除全部超过 1 小时的成绩吗？此操作无法撤销。',
  'Revisando {x} / {x}…': '正在检查 {x} / {x}…',
  'Quitadas {x} marcas de más de 1 hora ({x} tablas)': '已移除 {x} 条超过 1 小时的成绩（共 {x} 个榜单）',
  'No se pudo: {x}': '操作失败：{x}',
  'No se pudo cargar ({x}).': '无法加载（{x}）。',
  'No hay reportes.': '暂无举报记录。',
  'No hay cuentas baneadas.': '暂无已封禁的账号。',
  'veces reportada': '被举报次数',
  'Más de 33 min: casi imposible con la Sentencia de Arceus': '超过 33 分钟：在阿尔宙斯审判中几乎不可能达到',
  '· ya no está en el top 50': '· 已不在前 50 名',
  '· sólo': '· 仅限',
  'Borrar marca': '删除成绩', 'Marca borrada': '成绩已删除',
  'Banear': '封禁', 'Baneado': '已封禁',
  '¿Banear a {x}? No podrán volver a salir en el ranking y se borra su marca.': '确定封禁 {x} 吗？相关成绩将被删除，且无法再次登上排行榜。',
  'Descartar': '忽略', 'Reporte descartado': '举报已忽略',
  'Desbanear': '解除封禁', 'Desbaneada': '已解除封禁'
});
