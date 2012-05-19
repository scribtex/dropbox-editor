docs:
	docco public/editor/models/*.js
	md2html API.md > docs/API.html

clean:
	rm -rf docs
