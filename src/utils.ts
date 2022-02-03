import type { Program, Identifier, VariableDeclarator } from 'estree'
import acornWalk from 'acorn-walk'

export const drillDown = (obj: any, keys: Array<string>): any => {
  if (!obj) {
    return obj
  }
  const key = keys.shift()
  if (key) {
    if (!obj[key]) {
      obj[key] = {}
    }
    if (keys.length > 0) {
      return drillDown(obj[key], keys)
    } else {
      return obj[key]
    }
  } else {
    return obj
  }
}

export function isProgram(obj: acorn.Node | Program): obj is Program {
  return (<Program>obj).body !== undefined
}

export function isAcornNode(obj: acorn.Node | Program): obj is acorn.Node {
  return (<acorn.Node>obj).type !== undefined
}

export function clearExportNamedDeclaration(
  ast: acorn.Node | Program,
  exclude?: RegExp
): void {
  const filteredNodeList: Array<unknown> = []
  if (isAcornNode(ast)) {
    acornWalk.simple(ast, {
      ExportNamedDeclaration(node) {
        acornWalk.simple(node, {
          VariableDeclarator(variableDeclaratorNode: unknown) {
            let name = (<Identifier>(
              (<VariableDeclarator>variableDeclaratorNode).id
            )).name
            if (exclude && !exclude.test(name)) {
              filteredNodeList.push(node)
            }
          }
        })
      },
      ExportDefaultDeclaration(node) {
        filteredNodeList.push(node)
      }
    })
  }
  if (isProgram(ast)) {
    ast.body = ast.body.filter((item) => filteredNodeList.indexOf(item) === -1)
  }
}
